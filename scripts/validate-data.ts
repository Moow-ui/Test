/**
 * /data 폴더 전체 검증.
 *   npm run validate
 * 스키마 오류, 과목·단원 참조 오류, id 중복을 찾아 알려 준다.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { listQuestionFiles, pastQuestionFile, shortPath } from "../lib/data-files";
import { certDetailSchema, certSummarySchema, questionSchema } from "../lib/schemas";
import { checkCertDetail, checkCertList, checkQuestions } from "../lib/validate";
import type { Question } from "../lib/types";

z.config(z.locales.ko());

const DATA_DIR = path.join(process.cwd(), "data");
const errors: string[] = [];

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join(".") || "(전체)"}: ${i.message}`);
}

const summariesResult = z
  .array(certSummarySchema)
  .safeParse(readJson(path.join(DATA_DIR, "certifications.json")));

if (!summariesResult.success) {
  for (const m of formatIssues(summariesResult.error)) errors.push(`certifications.json → ${m}`);
} else {
  const summaries = summariesResult.data;
  errors.push(...checkCertList(summaries).map((e) => `certifications.json → ${e}`));
  console.log(`자격증 목록: ${summaries.length}종`);

  for (const summary of summaries) {
    const detailFile = path.join(DATA_DIR, "certs", `${summary.id}.json`);
    if (!fs.existsSync(detailFile)) continue;

    const detailResult = certDetailSchema.safeParse(readJson(detailFile));
    if (!detailResult.success) {
      for (const m of formatIssues(detailResult.error)) errors.push(`certs/${summary.id}.json → ${m}`);
      continue;
    }
    const detail = detailResult.data;
    if (detail.id !== summary.id) errors.push(`certs/${summary.id}.json → id 가 파일 이름과 다릅니다`);
    errors.push(...checkCertDetail(detail));

    const questions: Question[] = [];
    for (const file of listQuestionFiles(summary.id)) {
      const result = z.array(questionSchema).safeParse(readJson(file));
      if (!result.success) {
        for (const m of formatIssues(result.error)) errors.push(`${shortPath(file)} → ${m}`);
        continue;
      }
      // 기출 파일은 난이도별 폴더·단원별 파일에 맞게 들어 있어야 한다
      for (const q of result.data) {
        if (q.source !== "past") continue;
        const expected = pastQuestionFile(summary.id, q.level, q.chapterId);
        if (path.resolve(file) !== path.resolve(expected)) {
          errors.push(`${q.id}: 기출 파일 위치가 다릅니다 (${shortPath(file)} → ${shortPath(expected)})`);
        }
      }
      questions.push(...result.data);
    }
    errors.push(...checkQuestions(questions, detail));

    const past = questions.filter((q) => q.source === "past").length;
    console.log(
      `\n[${summary.name}] 문제 ${questions.length}개 (기출 ${past} / 예상 ${questions.length - past})`,
    );
    for (const subject of detail.subjects) {
      const inSubject = questions.filter((q) => q.subjectId === subject.id);
      const byLevel = ["basic", "intermediate", "advanced"]
        .map((l) => inSubject.filter((q) => q.level === l).length)
        .join("/");
      console.log(`  ${subject.name}: ${inSubject.length}개 (초급/중급/고급 = ${byLevel})`);
      for (const chapter of subject.chapters) {
        const n = inSubject.filter((q) => q.chapterId === chapter.id).length;
        console.log(`    - ${chapter.name}: ${n}개${n === 0 ? "  ← 문제 없음" : ""}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`\n오류 ${errors.length}건`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("\n데이터 검증 통과 ✓");
