/**
 * 문제 가져오기·갱신 (CSV / JSON → 검증 → 오류 행 리포트 → /data 에 병합)
 *
 * ※ 기출문제의 저작권은 한국산업인력공단에 있습니다.
 *   사용 권리가 확인된 데이터만 이 스크립트로 넣으세요.
 *
 * 사용법 (새 기출이 나올 때마다 같은 명령을 다시 실행하면 됩니다)
 *   npm run past:add -- <파일.csv 또는 파일.json> --cert <자격증 id> [옵션]
 *
 * 옵션
 *   --cert <id>     자격증 id (예: electrician-craftsman). 필수
 *   --update        이미 있는 문제 id 와 겹치면 새 내용으로 바꿈 (기본: 겹치면 오류로 처리)
 *   --dry-run       검증만 하고 파일은 쓰지 않음
 *   --out <파일명>  예상문제를 저장할 파일 이름 (기본: imported.json). 기출에는 쓰지 않음
 *
 * 저장 위치 (자동)
 *   기출:     data/questions/<id>/past/<난이도>/<단원 id>.json   ← 난이도별 폴더, 단원별 파일
 *   예상문제: data/questions/<id>/predicted/<파일명>
 *
 * 예
 *   npm run past:add -- scripts/templates/questions-template.csv --cert electrician-craftsman --dry-run
 *   npm run past:add -- 2026년1회.csv --cert electrician-craftsman
 *
 * CSV 열 (첫 줄은 열 이름. 순서는 상관없음)
 *   id            비워 두면 자동으로 만듦
 *   subjectId     과목 id 또는 과목 이름 (예: electric-theory 또는 전기이론)
 *   chapterId     단원 id 또는 단원 이름 (예: dc-circuit 또는 직류회로)
 *   source        past / predicted (또는 기출 / 예상)
 *   year, round   기출일 때만 (예: 2023, 1). 최근 10년 안의 기출만 수록
 *   number        기출 문항 번호 (id 자동 생성에 사용, 선택)
 *   level         basic / intermediate / advanced (또는 초급 / 중급 / 고급)
 *   correctRate   정답률 % (선택). level 을 비워 두면 정답률로 난이도를 정함: 70 이상 초급, 40 이상 중급, 그 아래 고급
 *   stem          문제
 *   choice1~4     선지 4개
 *   answer        정답 번호 1~4
 *   oneLineConcept  핵심 개념 한 줄
 *   explanation   상세 해설 (줄바꿈은 셀 안에서 Alt+Enter 또는 \n 으로)
 *   frequency     출제 빈도 1~5
 *   reviewStatus  verified / unverified (또는 검수완료 / 검수전)
 *   tags          태그 (| 로 구분)
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  certDetailFile,
  listQuestionFiles,
  pastQuestionFile,
  predictedQuestionFile,
  readJsonFile,
  shortPath,
} from "../lib/data-files";
import { isWithinPastWindow, levelFromCorrectRate, oldestPastYear } from "../lib/past";
import { certDetailSchema, questionSchema } from "../lib/schemas";
import type { CertDetail, Question } from "../lib/types";
import { checkQuestionRefs } from "../lib/validate";

// 검증 오류 문구를 한국어로
z.config(z.locales.ko());

const REPORT_FILE = path.join(process.cwd(), "import-report.json");

// ───────────────────────── 인자 ─────────────────────────

interface Args {
  file: string;
  cert: string;
  out: string;
  update: boolean;
  dryRun: boolean;
}

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  console.error("사용법: npm run past:add -- <파일.csv|파일.json> --cert <자격증 id> [--update] [--dry-run]");
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { out: "imported.json", update: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--cert") args.cert = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--update") args.update = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a.startsWith("--")) fail(`알 수 없는 옵션입니다: ${a}`);
    else args.file = a;
  }
  if (!args.file) fail("가져올 파일을 지정해 주세요.");
  if (!args.cert) fail("--cert <자격증 id> 를 지정해 주세요.");
  if (!args.out!.endsWith(".json")) args.out = `${args.out}.json`;
  if (/[\\/]/.test(args.out!)) fail("--out 에는 폴더 없이 파일 이름만 적어 주세요.");
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
  const source = SOURCE_ALIASES[sourceText] ?? sourceText;
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
    : [raw.choice1, raw.choice2, raw.choice3, raw.choice4].map(text);

  const tags = Array.isArray(raw.tags)
    ? raw.tags.map(text).filter(Boolean)
    : text(raw.tags)
        .split(/[|;]/)
        .map((t) => t.trim())
        .filter(Boolean);

  const stem = text(raw.stem);
  let id = text(raw.id);
  if (id === "") {
    const info = pastInfo as { year?: number; round?: number } | undefined;
    const number = text(raw.number);
    if (source === "past" && info?.year && info?.round && number !== "") {
      id = `${detail.id}-${info.year}-${info.round}-${number.padStart(3, "0")}`;
    } else {
      // 같은 문제는 다시 가져와도 같은 id 가 되도록 문제 내용으로 만든다
      const hash = createHash("sha1").update(`${stem}|${choices.join("|")}`).digest("hex").slice(0, 10);
      id = `${detail.id}-${source === "past" ? "past" : "pred"}-${hash}`;
    }
  }

  return {
    id,
    certId: text(raw.certId) || detail.id,
    subjectId: subject?.id ?? subjectText,
    chapterId: chapter?.id ?? chapterText,
    source,
    ...(pastInfo ? { pastInfo } : {}),
    level,
    stem,
    choices,
    answer: numberOrUndefined(raw.answer),
    oneLineConcept: text(raw.oneLineConcept),
    // 셀 안에 \n 이라고 적은 줄바꿈을 실제 줄바꿈으로 바꾼다
    explanation: text(raw.explanation).replace(/\\n/g, "\n"),
    frequency: numberOrUndefined(raw.frequency),
    reviewStatus: REVIEW_ALIASES[reviewText] ?? (reviewText || "unverified"),
    tags,
  };
}

// ───────────────────────── 실행 ─────────────────────────

interface RowError {
  row: number;
  id: string;
  stem: string;
  errors: string[];
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const inputFile = path.resolve(args.file);
  if (!fs.existsSync(inputFile)) fail(`파일을 찾을 수 없습니다: ${inputFile}`);

  const detailFile = certDetailFile(args.cert);
  if (!fs.existsSync(detailFile)) {
    fail(
      `data/certs/${args.cert}.json 이 없습니다. 자격증의 과목·단원 데이터를 먼저 만들어야 문제를 넣을 수 있습니다.`,
    );
  }
  const detail = certDetailSchema.parse(readJsonFile(detailFile));

  console.log(`\n[문제 가져오기] ${path.basename(inputFile)} → ${args.cert}`);
  console.log("※ 기출문제 저작권은 한국산업인력공단에 있습니다. 사용 권리가 확인된 데이터만 넣으세요.\n");

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

  // 2) 이미 있는 문제: 파일별 내용과, 문제 id 가 어느 파일에 있는지
  const fileContents = new Map<string, Question[]>();
  const whereIs = new Map<string, string>();
  for (const file of listQuestionFiles(args.cert)) {
    const list = z.array(questionSchema).parse(readJsonFile(file));
    fileContents.set(file, list);
    for (const q of list) whereIs.set(q.id, file);
  }

  /** 문제가 저장될 파일: 기출은 난이도·단원으로 자동 분류한다 */
  const targetFile = (q: Question) =>
    q.source === "past"
      ? pastQuestionFile(args.cert, q.level, q.chapterId)
      : predictedQuestionFile(args.cert, args.out);

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

    const result = questionSchema.safeParse(candidate);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "(전체)";
        if ((field === "subjectId" || field === "chapterId" || field === "level") && errors.length > 0) continue;
        errors.push(`${field}: ${issue.message}`);
      }
    } else if (errors.length === 0) {
      const q = result.data;
      errors.push(...checkQuestionRefs(q, detail));
      if (q.source === "past" && q.pastInfo && !isWithinPastWindow(q.pastInfo.year)) {
        errors.push(
          `${q.pastInfo.year}년 기출은 수록하지 않습니다 (최근 10년: ${oldestPastYear()}년 이후만 수록)`,
        );
      }
      if (seen.has(q.id)) errors.push(`같은 파일 안에 id 가 겹칩니다: ${q.id}`);
      const existing = whereIs.get(q.id);
      if (existing && !args.update) {
        errors.push(`이미 있는 문제 id 입니다: ${q.id} (${shortPath(existing)}). 내용을 바꾸려면 --update 옵션`);
      }
      if (errors.length === 0) {
        seen.add(q.id);
        if (existing) updated += 1;
        valid.push(q);
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

  // 5) 병합: 바뀌는 파일만 다시 쓴다
  const changed = new Set<string>();
  for (const q of valid) {
    const from = whereIs.get(q.id);
    if (from) {
      // 내용 교체(--update): 예전 위치에서 빼고 새 위치(난이도·단원이 바뀌었을 수 있음)에 넣는다
      fileContents.set(
        from,
        (fileContents.get(from) ?? []).filter((x) => x.id !== q.id),
      );
      changed.add(from);
    }
    const to = targetFile(q);
    fileContents.set(to, [...(fileContents.get(to) ?? []), q]);
    changed.add(to);
  }

  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      {
        file: inputFile,
        certId: args.cert,
        written: args.dryRun ? [] : [...changed].map(shortPath),
        total: rawRows.length,
        passed: valid.length,
        failed: rowErrors.length,
        errors: rowErrors,
      },
      null,
      2,
    ),
  );
  console.log(`\n오류 리포트: import-report.json`);

  if (args.dryRun) {
    console.log("\n(--dry-run) 검증만 했습니다. 파일은 바뀌지 않았습니다.");
    if (changed.size > 0) {
      console.log("실제로 실행하면 아래 파일에 들어갑니다:");
      for (const file of changed) console.log(`  ${shortPath(file)}`);
    }
    console.log("");
  } else if (valid.length === 0) {
    console.log("\n통과한 문제가 없어 파일을 쓰지 않았습니다.\n");
  } else {
    for (const file of changed) {
      const list = fileContents.get(file) ?? [];
      if (list.length === 0) {
        fs.rmSync(file, { force: true });
        continue;
      }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(list, null, 2)}\n`);
    }
    console.log(`\n✓ ${valid.length}문제를 넣었습니다.`);
    for (const file of changed) {
      console.log(`  ${shortPath(file)} (${(fileContents.get(file) ?? []).length}문제)`);
    }
    console.log("\n다음 순서: npm run past:status → npm run build → git push (push 하면 자동 배포)\n");
  }

  if (rowErrors.length > 0) process.exitCode = 1;
}

// 다른 파일에서 parseCsv 만 불러 쓸 수 있게, 직접 실행했을 때만 main 을 돌린다
if (process.argv[1] && path.resolve(process.argv[1]).includes("import-questions")) {
  main();
}
