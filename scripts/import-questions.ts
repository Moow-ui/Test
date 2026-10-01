/**
 * 문제 넣기·고치기 (CSV / JSON → 검증 → 오류 행 리포트 → 자격증 폴더의 단원별 파일에 병합)
 *
 * ※ 모든 문제는 직접 만든 AI 예상문제여야 합니다. 기출 원문을 넣지 않습니다 (docs/data-rules.md).
 *
 * 사용법
 *   npm run questions:add -- <파일.csv 또는 파일.json> --cert <자격증 slug> [옵션]
 *
 * 옵션
 *   --cert <slug>   자격증 slug (예: electrician-craftsman). 필수
 *   --update        이미 있는 문제 id 와 겹치면 새 내용으로 바꾸고 version 을 1 올림 (기본: 겹치면 오류)
 *   --dry-run       검증만 하고 파일은 쓰지 않음
 *
 * 저장 위치 (자동)
 *   data/certs/{country}/{slug}/questions/{단원 id}.json   (300문항이 넘으면 -2, -3 파일)
 *
 * 문제 id (자동)
 *   id 를 비워 두면 "{slug}-{단원 id}-{4자리 번호}" 로 그 단원의 다음 번호를 붙인다.
 *   한번 정한 id 는 바꾸거나 다시 쓰지 않는다. 문제를 없앨 때는 지우지 말고 retired 를 true 로.
 *
 * 예
 *   npm run questions:add -- scripts/templates/questions-template.csv --cert electrician-craftsman --dry-run
 *
 * CSV 열 (첫 줄은 열 이름. 순서는 상관없음)
 *   id            비워 두면 자동으로 만듦 (고칠 때만 적는다)
 *   subjectId     과목 id 또는 과목 이름 (예: electric-theory 또는 전기이론)
 *   chapterId     단원 id 또는 단원 이름 (예: dc-circuit 또는 직류회로)
 *   source        predicted (또는 예상). 비워 두면 predicted
 *   level         basic / intermediate / advanced (또는 초급 / 중급 / 고급)
 *   correctRate   정답률 % (선택). level 을 비워 두면 정답률로 난이도를 정함: 70 이상 초급, 40 이상 중급, 그 아래 고급
 *   stem          문제
 *   choice1~N     선지 (개수는 자격증 meta.json 의 examInfo.choiceCount)
 *   answer        정답 번호
 *   oneLineConcept  핵심 개념 한 줄
 *   explanation   상세 해설 (줄바꿈은 셀 안에서 Alt+Enter 또는 \n 으로)
 *   frequency     출제 빈도 1~5
 *   reviewStatus  verified / unverified (또는 검수완료 / 검수전)
 *   tags          태그 (| 로 구분)
 *   retired       true 면 출제 중단
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getCertSummary, getCertification, getQuestionFiles } from "../lib/data";
import { writeDataJson } from "../lib/data/fs-store";
import { questionFileStem, questionId, questionIdNumber, questionsDir } from "../lib/data/paths";
import { levelFromCorrectRate } from "../lib/past";
import { MAX_QUESTIONS_PER_FILE, questionSchema } from "../lib/schemas";
import type { CertDetail, Question } from "../lib/types";
import { checkQuestionRefs } from "../lib/validate";

// 검증 오류 문구를 한국어로
z.config(z.locales.ko());

/** 리포트는 월별 폴더에 쌓는다: reports/{YYYY-MM}/import-{slug}-{시각}.json */
function reportFile(slug: string, now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  return path.join(process.cwd(), "reports", stamp.slice(0, 7), `import-${slug}-${stamp}.json`);
}

// ───────────────────────── 인자 ─────────────────────────

interface Args {
  file: string;
  cert: string;
  update: boolean;
  dryRun: boolean;
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  console.error("사용법: npm run questions:add -- <파일.csv|파일.json> --cert <자격증 slug> [--update] [--dry-run]");
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { update: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cert") args.cert = argv[++i];
    else if (a === "--update") args.update = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a.startsWith("--")) fail(`알 수 없는 옵션입니다: ${a}`);
    else args.file = a;
  }
  if (!args.file) fail("가져올 파일을 지정해 주세요.");
  if (!args.cert) fail("--cert <자격증 slug> 를 지정해 주세요.");
  return args as Args;
}

// ───────────────────────── 파일 읽기 ─────────────────────────

/** 엑셀에서 저장한 CSV 는 UTF-8 이 아닐 수 있다(EUC-KR/CP949). 둘 다 읽을 수 있게 한다 */
function readText(file: string): string {
  const buffer = fs.readFileSync(file);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    console.log("  (UTF-8 이 아니어서 EUC-KR 로 읽었습니다)");
    return new TextDecoder("euc-kr").decode(buffer);
  }
}

/** CSV 파서 (따옴표, 따옴표 안의 쉼표·줄바꿈, "" 이스케이프 지원) */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// ───────────────────────── 행 → 문제 ─────────────────────────

const LEVEL_ALIASES: Record<string, string> = { 초급: "basic", 중급: "intermediate", 고급: "advanced" };
const SOURCE_ALIASES: Record<string, string> = { 기출: "past", 기출문제: "past", 예상: "predicted", 예상문제: "predicted" };
const REVIEW_ALIASES: Record<string, string> = {
  검수완료: "verified",
  "검수 완료": "verified",
  검수전: "unverified",
  "검수 전": "unverified",
};

type Raw = Record<string, unknown>;

function text(value: unknown): string {
  return value === undefined || value === null ? "" : String(value).trim();
}

function numberOrUndefined(value: unknown): number | undefined {
  const t = text(value);
  if (t === "") return undefined;
  const n = Number(t.replace(/%$/, ""));
  return Number.isFinite(n) ? n : NaN;
}

/** CSV 한 줄(또는 JSON 한 건)을 Question 모양으로 바꾼다. 검증은 그다음 단계에서 한다 */
function toCandidate(raw: Raw, detail: CertDetail): Raw {
  // 과목·단원은 id 대신 이름으로 적어도 된다
  const subjectText = text(raw.subjectId ?? raw.subject);
  const subject = detail.subjects.find((s) => s.id === subjectText || s.name === subjectText);
  const chapterText = text(raw.chapterId ?? raw.chapter);
  const chapterPool = subject ? subject.chapters : detail.subjects.flatMap((s) => s.chapters);
  const chapter = chapterPool.find((c) => c.id === chapterText || c.name === chapterText);

  const sourceText = text(raw.source);
  const source = SOURCE_ALIASES[sourceText] ?? (sourceText || "predicted");
  const reviewText = text(raw.reviewStatus);

  // 난이도: 직접 적었으면 그 값, 비워 두었으면 정답률로 정한다
  const levelText = text(raw.level);
  const correctRate = numberOrUndefined(raw.correctRate);
  let level = LEVEL_ALIASES[levelText] ?? levelText;
  if (level === "" && correctRate !== undefined && !Number.isNaN(correctRate)) {
    level = levelFromCorrectRate(correctRate);
  }

  const pastInfo =
    raw.pastInfo && typeof raw.pastInfo === "object"
      ? raw.pastInfo
      : text(raw.year) !== "" || text(raw.round) !== ""
        ? { year: numberOrUndefined(raw.year), round: numberOrUndefined(raw.round) }
        : undefined;

  const choices = Array.isArray(raw.choices)
    ? raw.choices.map(text)
    : Array.from({ length: detail.examInfo.choiceCount }, (_, i) => text(raw[`choice${i + 1}`]));

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map(text).filter(Boolean)
    : text(raw.tags)
        .split(/[|;]/)
        .map((t) => t.trim())
        .filter(Boolean);

  const retiredText = text(raw.retired).toLowerCase();

  return {
    // 비어 있으면 검증을 통과한 뒤 그 단원의 다음 번호를 붙인다
    id: text(raw.id),
    certId: text(raw.certId) || detail.id,
    subjectId: subject?.id ?? subjectText,
    chapterId: chapter?.id ?? chapterText,
    source,
    ...(pastInfo ? { pastInfo } : {}),
    level,
    stem: text(raw.stem),
    choices,
    answer: numberOrUndefined(raw.answer),
    oneLineConcept: text(raw.oneLineConcept),
    // 셀 안에 \n 이라고 적은 줄바꿈을 실제 줄바꿈으로 바꾼다
    explanation: text(raw.explanation).replace(/\\n/g, "\n"),
    frequency: numberOrUndefined(raw.frequency),
    reviewStatus: REVIEW_ALIASES[reviewText] ?? (reviewText || "unverified"),
    tags,
    ...(text(raw.image) ? { image: text(raw.image) } : {}),
    ...(retiredText === "true" || retiredText === "1" ? { retired: true } : {}),
  };
}

// ───────────────────────── 실행 ─────────────────────────

interface RowError {
  row: number;
  id: string;
  stem: string;
  errors: string[];
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const inputFile = path.resolve(args.file);
  if (!fs.existsSync(inputFile)) fail(`파일을 찾을 수 없습니다: ${inputFile}`);

  const summary = await getCertSummary(args.cert);
  const cert = await getCertification(args.cert);
  if (!summary || !cert) fail(`자격증을 찾을 수 없습니다: ${args.cert}`);
  if (!cert.examInfo || !cert.updatedAt || cert.subjects.length === 0) {
    fail("meta.json 의 examInfo 와 chapters.json 을 먼저 만들어야 문제를 넣을 수 있습니다 (docs/add-cert.md).");
  }
  const detail: CertDetail = { id: cert.id, updatedAt: cert.updatedAt, examInfo: cert.examInfo, subjects: cert.subjects };
  const dir = questionsDir(summary.country, summary.id);

  console.log(`\n[문제 넣기] ${path.basename(inputFile)} → ${args.cert}\n`);

  // 1) 읽기
  let rawRows: Array<{ raw: Raw; row: number }>;
  if (inputFile.toLowerCase().endsWith(".json")) {
    const parsed: unknown = JSON.parse(readText(inputFile));
    if (!Array.isArray(parsed)) fail("JSON 파일은 문제 배열([ {...}, {...} ]) 이어야 합니다.");
    rawRows = (parsed as Raw[]).map((raw, i) => ({ raw, row: i + 1 }));
  } else {
    const rows = parseCsv(readText(inputFile));
    if (rows.length < 2) fail("CSV 에 열 이름 줄과 데이터 줄이 있어야 합니다.");
    const header = rows[0].map((h) => h.trim());
    rawRows = rows.slice(1).map((cells, i) => ({
      raw: Object.fromEntries(header.map((h, ci) => [h, cells[ci] ?? ""])),
      row: i + 2, // 엑셀에서 보이는 줄 번호 (1번 줄은 열 이름)
    }));
  }

  // 2) 이미 있는 문제 (단원별)
  const byChapter = new Map<string, Question[]>();
  const existing = new Map<string, Question>();
  for (const file of await getQuestionFiles(args.cert)) {
    for (const q of file.questions) {
      existing.set(q.id, q);
      byChapter.set(q.chapterId, [...(byChapter.get(q.chapterId) ?? []), q]);
    }
  }
  /** 그 단원의 다음 번호 (출제 중단 문제의 번호도 다시 쓰지 않는다) */
  const nextNumber = new Map<string, number>();
  const newId = (chapterId: string): string => {
    const used = [...existing.keys()].map((id) => questionIdNumber(detail.id, chapterId, id) ?? 0);
    const n = Math.max(nextNumber.get(chapterId) ?? 0, ...used) + 1;
    nextNumber.set(chapterId, n);
    return questionId(detail.id, chapterId, n);
  };

  // 3) 검증
  const valid: Question[] = [];
  const rowErrors: RowError[] = [];
  const seen = new Set<string>();
  let updated = 0;

  for (const { raw, row } of rawRows) {
    const candidate = toCandidate(raw, detail);
    const errors: string[] = [];

    // 과목·단원을 못 찾은 경우는 알기 쉬운 문구로 먼저 알려 준다
    const subject = detail.subjects.find((s) => s.id === candidate.subjectId);
    const chapterFound = (subject ? subject.chapters : []).some((c) => c.id === candidate.chapterId);
    if (!subject) errors.push(`과목을 찾을 수 없습니다: "${text(candidate.subjectId)}"`);
    else if (!chapterFound) {
      errors.push(`"${subject.name}" 과목에서 단원을 찾을 수 없습니다: "${text(candidate.chapterId)}"`);
    }
    if (candidate.level === "") {
      errors.push("난이도가 없습니다: level(초급/중급/고급) 또는 correctRate(정답률 %) 중 하나를 적어 주세요");
    }

    const isNew = candidate.id === "";
    const result = questionSchema.safeParse(isNew ? { ...candidate, id: "(new)" } : candidate);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "(전체)";
        if ((field === "subjectId" || field === "chapterId" || field === "level") && errors.length > 0) continue;
        errors.push(`${field}: ${issue.message}`);
      }
    } else if (errors.length === 0) {
      const q = result.data;
      errors.push(...checkQuestionRefs(q, detail));
      if (q.choices.length !== detail.examInfo.choiceCount) {
        errors.push(`선지가 ${q.choices.length}개입니다 (이 자격증은 ${detail.examInfo.choiceCount}개)`);
      }
      const old = isNew ? undefined : existing.get(q.id);
      if (!isNew && !old) errors.push(`없는 문제 id 입니다: ${q.id}. 새 문제는 id 를 비워 두세요 (자동으로 붙습니다)`);
      if (!isNew && seen.has(q.id)) errors.push(`같은 파일 안에 id 가 겹칩니다: ${q.id}`);
      if (old && !args.update) errors.push(`이미 있는 문제 id 입니다: ${q.id}. 내용을 바꾸려면 --update 옵션`);
      if (errors.length === 0) {
        if (old) {
          updated += 1;
          valid.push({ ...q, version: old.version + 1 });
        } else {
          valid.push({ ...q, id: newId(q.chapterId) });
        }
        seen.add(valid[valid.length - 1].id);
      }
    }

    if (errors.length > 0) {
      rowErrors.push({ row, id: text(candidate.id), stem: text(candidate.stem).slice(0, 40), errors });
    }
  }

  // 4) 리포트
  console.log(`읽은 행: ${rawRows.length}`);
  console.log(`  통과: ${valid.length} (새 문제 ${valid.length - updated}, 내용 교체 ${updated})`);
  console.log(`  오류: ${rowErrors.length}`);

  if (rowErrors.length > 0) {
    console.log("\n── 오류 행 ──");
    for (const e of rowErrors) {
      console.log(`  ${e.row}번째 줄${e.stem ? ` "${e.stem}…"` : ""}`);
      for (const message of e.errors) console.log(`     ✗ ${message}`);
    }
    console.log("\n과목·단원에 쓸 수 있는 값:");
    for (const s of detail.subjects) {
      console.log(`  ${s.id} (${s.name}): ${s.chapters.map((c) => `${c.id}(${c.name})`).join(", ")}`);
    }
  }

  // 5) 병합: 바뀌는 단원만 다시 쓴다 (고친 문제는 제자리에, 새 문제는 뒤에)
  const changed = new Set<string>();
  for (const q of valid) {
    const old = existing.get(q.id);
    if (old) {
      byChapter.set(old.chapterId, (byChapter.get(old.chapterId) ?? []).filter((x) => x.id !== q.id));
      changed.add(old.chapterId);
    }
    const list = byChapter.get(q.chapterId) ?? [];
    const at = old && old.chapterId === q.chapterId ? list.findIndex((x) => x.id > q.id) : -1;
    byChapter.set(q.chapterId, at < 0 ? [...list, q] : [...list.slice(0, at), q, ...list.slice(at)]);
    changed.add(q.chapterId);
  }

  /** 단원의 문제를 파일당 최대 문항 수로 나눈 결과: [파일 경로, 문제들] */
  const filesOf = (chapterId: string): Array<[string, Question[]]> => {
    const list = byChapter.get(chapterId) ?? [];
    const parts: Array<[string, Question[]]> = [];
    for (let i = 0; i < list.length; i += MAX_QUESTIONS_PER_FILE) {
      const stem = questionFileStem(chapterId, i / MAX_QUESTIONS_PER_FILE + 1);
      parts.push([`${dir}/${stem}.json`, list.slice(i, i + MAX_QUESTIONS_PER_FILE)]);
    }
    return parts;
  };
  const written = [...changed].flatMap(filesOf);

  const report = reportFile(args.cert);
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(
    report,
    JSON.stringify(
      {
        file: path.basename(inputFile),
        certId: args.cert,
        written: args.dryRun ? [] : written.map(([file]) => `data/${file}`),
        total: rawRows.length,
        passed: valid.length,
        failed: rowErrors.length,
        newIds: valid.filter((q) => !existing.has(q.id)).map((q) => q.id),
        errors: rowErrors,
      },
      null,
      2,
    ),
  );
  console.log(`\n리포트: ${path.relative(process.cwd(), report).split(path.sep).join("/")}`);

  if (args.dryRun) {
    console.log("\n(--dry-run) 검증만 했습니다. 파일은 바뀌지 않았습니다.");
    for (const [file, list] of written) console.log(`  data/${file} (${list.length}문제)`);
    console.log("");
  } else if (valid.length === 0) {
    console.log("\n통과한 문제가 없어 파일을 쓰지 않았습니다.\n");
  } else {
    // JSON 에는 기본값(version 1, retired false)을 적지 않는다
    const compact = ({ version, retired, ...q }: Question) => ({
      ...q,
      ...(version > 1 ? { version } : {}),
      ...(retired ? { retired } : {}),
    });
    for (const [file, list] of written) writeDataJson(file, list.map(compact));
    console.log(`\n✓ ${valid.length}문제를 넣었습니다.`);
    for (const [file, list] of written) console.log(`  data/${file} (${list.length}문제)`);
    console.log("\n다음 순서: npm run validate → npm run build → 커밋 → git push (push 하면 자동 배포)\n");
  }

  if (rowErrors.length > 0) process.exitCode = 1;
}

// 다른 파일에서 parseCsv 만 불러 쓸 수 있게, 직접 실행했을 때만 main 을 돌린다
if (process.argv[1] && path.resolve(process.argv[1]).includes("import-questions")) {
  void main();
}
