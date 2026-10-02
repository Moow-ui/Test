import { z } from "zod";
import {
  COUNTRIES,
  LEVELS,
  MAX_QUESTIONS_PER_FILE,
  certMetaSchema,
  certQueueSchema,
  chaptersFileSchema,
  examSetSchema,
  questionSchema,
} from "../schemas";
import { mockExamShortage } from "../quiz-engine";
import type { CertDetail, CertMeta, Question } from "../types";
import { checkCertDetail, checkCertList, checkQuestions } from "../validate";
import {
  CERTS_DIR,
  CERT_DIR_ENTRIES,
  CERT_QUEUE_FILE,
  EXAM_FILE_PATTERN,
  LEGACY_IDS_FILE,
  assetsDir,
  certDir,
  chaptersFile,
  countryDir,
  examsDir,
  isQuestionIdFor,
  metaFile,
  questionFileStem,
  questionsDir,
} from "./paths";
import type { DataStore } from "./store";

/**
 * /data 폴더 전체 검사 (npm run validate, 빌드 전에 자동 실행).
 * 스키마, 폴더·파일 이름, 문제 id 규칙·중복, 정답 번호 범위, 선지 수, 난이도별 선지(choicesByLevel), 필수 필드, 과목·단원 참조.
 * 하나라도 틀리면 errors 에 담아 돌려주고, 빌드(배포)는 중단된다.
 */

export interface ValidationResult {
  errors: string[];
  /** 화면에 보여 줄 현황 */
  lines: string[];
  certCount: number;
  questionCount: number;
}

function issues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join(".") || "(전체)"}: ${i.message}`);
}

export async function validateData(store: DataStore): Promise<ValidationResult> {
  const errors: string[] = [];
  const lines: string[] = [];
  const metas: CertMeta[] = [];
  let questionCount = 0;
  /** 문제 id → 자격증 (자격증이 달라도 id 는 겹치면 안 된다) */
  const owner = new Map<string, string>();

  const legacyRaw = z.array(z.string()).safeParse((await store.readJson(LEGACY_IDS_FILE)) ?? []);
  if (!legacyRaw.success) errors.push(`${LEGACY_IDS_FILE} → 문제 id 문자열의 배열이어야 합니다`);
  const legacyIds = new Set(legacyRaw.success ? legacyRaw.data : []);

  const queueRaw = await store.readJson(CERT_QUEUE_FILE);
  const queueResult = certQueueSchema.safeParse(queueRaw ?? []);
  if (!queueResult.success) for (const m of issues(queueResult.error)) errors.push(`${CERT_QUEUE_FILE} → ${m}`);
  const queue = queueResult.success ? queueResult.data : [];

  for (const country of await store.list(CERTS_DIR)) {
    if (!(COUNTRIES as readonly string[]).includes(country)) {
      errors.push(`${countryDir(country)} → 나라 폴더는 ${COUNTRIES.join(", ")} 만 쓸 수 있습니다`);
      continue;
    }
    for (const slug of await store.list(countryDir(country))) {
      const where = certDir(country, slug);

      for (const name of await store.list(where)) {
        if (!CERT_DIR_ENTRIES.includes(name)) {
          errors.push(`${where}/${name} → 자격증 폴더에 둘 수 없는 이름입니다 (${CERT_DIR_ENTRIES.join(", ")})`);
        }
      }

      // ── meta.json
      const metaRaw = await store.readJson(metaFile(country, slug));
      if (metaRaw === null) {
        errors.push(`${where} → meta.json 이 없습니다`);
        continue;
      }
      const metaResult = certMetaSchema.safeParse(metaRaw);
      if (!metaResult.success) {
        for (const m of issues(metaResult.error)) errors.push(`${metaFile(country, slug)} → ${m}`);
        continue;
      }
      const meta = metaResult.data;
      metas.push(meta);
      if (meta.id !== slug) errors.push(`${metaFile(country, slug)} → id 가 폴더 이름(${slug})과 다릅니다`);
      if (meta.country !== country) {
        errors.push(`${metaFile(country, slug)} → country 가 폴더(${country})와 다릅니다`);
      }

      // ── chapters.json ("준비 중" 자격증에는 없다)
      const chaptersRaw = await store.readJson(chaptersFile(country, slug));
      const questionFiles = (await store.list(questionsDir(country, slug))).filter((n) => n.endsWith(".json"));
      // 대기 목록의 slug 는 폴더 이름과 같다. 문제까지 들어간 자격증은 대기 목록에서 뺀다
      const queued = queue.find((item) => item.slug === slug);
      if (queued && queued.country !== country) {
        errors.push(`${CERT_QUEUE_FILE} → ${slug}: 나라(${queued.country})가 자격증 폴더(${country})와 다릅니다`);
      }
      if (queued && questionFiles.length > 0) {
        errors.push(`${CERT_QUEUE_FILE} → ${slug}: 이미 문제가 있는 자격증입니다 (대기 목록에서 뺍니다)`);
      }
      if (chaptersRaw === null) {
        if (questionFiles.length > 0) errors.push(`${where} → 문제는 있는데 chapters.json 이 없습니다`);
        continue;
      }
      const chaptersResult = chaptersFileSchema.safeParse(chaptersRaw);
      if (!chaptersResult.success) {
        for (const m of issues(chaptersResult.error)) errors.push(`${chaptersFile(country, slug)} → ${m}`);
        continue;
      }
      if (!meta.examInfo || !meta.updatedAt) {
        errors.push(`${metaFile(country, slug)} → chapters.json 이 있으면 examInfo 와 updatedAt 이 필요합니다`);
        continue;
      }
      if (questionFiles.length > 0 && !meta.studyTips) {
        errors.push(`${metaFile(country, slug)} → 문제가 있는 자격증에는 운영진 학습 팁(studyTips) 3개가 필요합니다`);
      }
      const detail: CertDetail = {
        id: meta.id,
        updatedAt: meta.updatedAt,
        examInfo: meta.examInfo,
        subjects: chaptersResult.data.subjects,
        content: meta.content,
      };
      errors.push(...checkCertDetail(detail));
      const chapterIds = detail.subjects.flatMap((s) => s.chapters.map((c) => c.id));
      const assets = new Set(await store.list(assetsDir(country, slug)));

      // ── questions/{chapterId}.json, {chapterId}-2.json …
      const questions: Question[] = [];
      for (const name of questionFiles) {
        const file = `${questionsDir(country, slug)}/${name}`;
        const stem = name.replace(/\.json$/, "");
        const result = z.array(questionSchema).safeParse(await store.readJson(file));
        if (!result.success) {
          for (const m of issues(result.error)) errors.push(`${file} → ${m}`);
          continue;
        }
        const list = result.data;
        if (list.length === 0) errors.push(`${file} → 문제가 없는 파일입니다`);
        if (list.length > MAX_QUESTIONS_PER_FILE) {
          errors.push(`${file} → ${list.length}문항. 파일당 최대 ${MAX_QUESTIONS_PER_FILE}문항 (넘으면 -2, -3 파일로 나눕니다)`);
        }
        const chapterId = list[0]?.chapterId ?? "";
        const part = stem === chapterId ? 1 : Number(stem.slice(chapterId.length + 1));
        if (!chapterIds.includes(chapterId) || !(part >= 1) || questionFileStem(chapterId, part) !== stem) {
          errors.push(`${file} → 파일 이름은 "{단원 id}.json" 또는 "{단원 id}-2.json" 형식이어야 합니다`);
        }
        for (const q of list) {
          if (q.chapterId !== chapterId) errors.push(`${q.id}: 단원(${q.chapterId})이 파일(${file})과 다릅니다`);
          if (!isQuestionIdFor(slug, q.id) && !legacyIds.has(q.id)) {
            errors.push(`${q.id}: 문제 id 는 "${slug}-{단원 id}-{4자리 번호}" 형식이어야 합니다`);
          }
          if (q.choices.length !== detail.examInfo.choiceCount) {
            errors.push(`${q.id}: 선지가 ${q.choices.length}개입니다 (이 자격증은 ${detail.examInfo.choiceCount}개)`);
          }
          if (q.image && !assets.has(q.image)) errors.push(`${q.id}: 그림 파일이 없습니다 (assets/${q.image})`);
        }
        questions.push(...list);
      }
      errors.push(...checkQuestions(questions, detail));
      for (const q of questions) {
        const other = owner.get(q.id);
        if (other && other !== slug) errors.push(`${q.id}: 다른 자격증(${other})에 같은 문제 id 가 있습니다`);
        owner.set(q.id, slug);
      }
      questionCount += questions.length;

      // ── exams/{year}-{round}.json
      const ids = new Set(questions.map((q) => q.id));
      for (const name of await store.list(examsDir(country, slug))) {
        const file = `${examsDir(country, slug)}/${name}`;
        if (!EXAM_FILE_PATTERN.test(name)) {
          errors.push(`${file} → 파일 이름은 "{연도}-{회차}.json" 형식이어야 합니다`);
          continue;
        }
        const result = examSetSchema.safeParse(await store.readJson(file));
        if (!result.success) {
          for (const m of issues(result.error)) errors.push(`${file} → ${m}`);
          continue;
        }
        for (const id of result.data.questionIds) {
          if (!ids.has(id)) errors.push(`${file} → 없는 문제 id 입니다: ${id}`);
        }
      }

      // ── 현황
      const active = questions.filter((q) => !q.retired);
      lines.push(`\n[${meta.name}] 문제 ${active.length}개${questions.length > active.length ? ` (+출제 중단 ${questions.length - active.length})` : ""}`);
      const locked = active.filter((q) => q.levelLock).length;
      const shortage = mockExamShortage(detail.subjects, active);
      lines.push(
        `  선지를 줄일 수 없는 문제(levelLock) ${locked}개 · 실전 문제풀이(${detail.examInfo.totalQuestions}문항): ${
          shortage.length === 0
            ? "낼 수 있음"
            : `문제 부족 (${shortage.map((s) => `${s.subjectId} ${s.have}/${s.need}`).join(", ")})`
        }`,
      );
      for (const subject of detail.subjects) {
        const inSubject = active.filter((q) => q.subjectId === subject.id);
        const byLevel = LEVELS.map((l) => inSubject.filter((q) => q.level === l).length).join("/");
        lines.push(`  ${subject.name}: ${inSubject.length}개 (초급/중급/고급 = ${byLevel})`);
        for (const chapter of subject.chapters) {
          const n = inSubject.filter((q) => q.chapterId === chapter.id).length;
          lines.push(`    - ${chapter.name}: ${n}개${n === 0 ? "  ← 문제 없음" : ""}`);
        }
      }
    }
  }

  // slug 는 나라가 달라도 겹치면 안 된다 (문제 id·배포 파일 주소가 slug 로 시작한다)
  errors.push(...checkCertList(metas));

  if (queue.length > 0) {
    lines.push(
      `\n[대기 목록] ${COUNTRIES.map((c) => `${c} ${queue.filter((item) => item.country === c).length}개`).join(" · ")}`,
    );
  }

  return { errors, lines, certCount: metas.length, questionCount };
}
