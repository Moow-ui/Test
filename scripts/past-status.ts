/**
 * 기출문제 현황 보기 / 오래된 기출 정리
 *
 *   npm run past:status                      전체 자격증의 기출 현황
 *   npm run past:status -- --cert <id>       자격증 하나만 자세히 (단원별)
 *   npm run past:prune                       최근 10년보다 오래된 기출을 파일에서 지움
 *   npm run past:prune -- --dry-run          지울 대상만 보여 줌
 *
 * 기출은 난이도별 폴더·단원별 파일로 정리되어 있다:
 *   data/questions/<id>/past/<basic|intermediate|advanced>/<단원 id>.json
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DATA_DIR, certDetailFile, listQuestionFiles, readJsonFile, shortPath } from "../lib/data-files";
import { LEVEL_LABEL } from "../lib/format";
import { PAST_WINDOW_YEARS, isWithinPastWindow, oldestPastYear } from "../lib/past";
import { LEVELS, certDetailSchema, certSummarySchema, questionSchema } from "../lib/schemas";
import type { Question } from "../lib/types";

const argv = process.argv.slice(2);
const prune = argv.includes("--prune");
const dryRun = argv.includes("--dry-run");
const certArg = argv.includes("--cert") ? argv[argv.indexOf("--cert") + 1] : null;

const summaries = z
  .array(certSummarySchema)
  .parse(readJsonFile(path.join(DATA_DIR, "certifications.json")));
const targets = certArg ? summaries.filter((s) => s.id === certArg) : summaries;
if (certArg && targets.length === 0) {
  console.error(`자격증 id 를 찾을 수 없습니다: ${certArg}`);
  process.exit(1);
}

console.log(`\n기출 수록 기준: 최근 ${PAST_WINDOW_YEARS}년 (${oldestPastYear()}년 이후)\n`);

let totalPast = 0;
let totalOld = 0;

for (const summary of targets) {
  const files = listQuestionFiles(summary.id);
  const perFile = files.map((file) => ({
    file,
    questions: z.array(questionSchema).parse(readJsonFile(file)),
  }));
  const all = perFile.flatMap((f) => f.questions);
  const past = all.filter((q) => q.source === "past");
  const old = past.filter((q) => q.pastInfo && !isWithinPastWindow(q.pastInfo.year));
  const current = past.filter((q) => !old.includes(q));
  const predicted = all.length - past.length;
  totalPast += current.length;
  totalOld += old.length;

  const hasDetail = fs.existsSync(certDetailFile(summary.id));
  if (!certArg && all.length === 0) {
    console.log(`${summary.name.padEnd(16)} 문제 없음${hasDetail ? "" : " (과목·단원 데이터도 없음)"}`);
    continue;
  }

  const byLevel = LEVELS.map(
    (level) => `${LEVEL_LABEL[level]} ${current.filter((q) => q.level === level).length}`,
  ).join(" / ");
  console.log(`${summary.name}  —  기출 ${current.length} (${byLevel}) · 예상 ${predicted}`);

  const years = [...new Set(current.map((q) => q.pastInfo!.year))].sort((a, b) => b - a);
  if (years.length > 0) {
    console.log(
      `  연도별: ${years.map((y) => `${y}년 ${current.filter((q) => q.pastInfo!.year === y).length}`).join(", ")}`,
    );
  }
  if (old.length > 0) {
    console.log(`  ! ${oldestPastYear()}년 이전 기출 ${old.length}문제 (사이트에는 나오지 않음. npm run past:prune 로 정리)`);
  }

  if (certArg && hasDetail) {
    const detail = certDetailSchema.parse(readJsonFile(certDetailFile(summary.id)));
    console.log("\n  단원별 기출 (초급/중급/고급)");
    for (const subject of detail.subjects) {
      console.log(`  [${subject.name}]`);
      subject.chapters.forEach((chapter, i) => {
        const inChapter = current.filter((q) => q.chapterId === chapter.id);
        const counts = LEVELS.map((level) => inChapter.filter((q) => q.level === level).length).join("/");
        console.log(`    ${i + 1}단원 ${chapter.name}: ${inChapter.length}문제 (${counts})`);
      });
    }
  }

  if (prune && old.length > 0) {
    const oldIds = new Set(old.map((q) => q.id));
    for (const { file, questions } of perFile) {
      const kept: Question[] = questions.filter((q) => !oldIds.has(q.id));
      if (kept.length === questions.length) continue;
      console.log(`  ${dryRun ? "(지울 예정)" : "지움"} ${shortPath(file)}: ${questions.length - kept.length}문제`);
      if (dryRun) continue;
      if (kept.length === 0) fs.rmSync(file);
      else fs.writeFileSync(file, `${JSON.stringify(kept, null, 2)}\n`);
    }
  }
  console.log("");
}

console.log(`합계: 수록 기출 ${totalPast}문제${totalOld > 0 ? `, 오래된 기출 ${totalOld}문제` : ""}`);
if (totalPast === 0) {
  console.log("등록된 기출이 없습니다. 초급·중급은 기출이 등록될 때까지 AI 예상문제로 대신 출제됩니다.");
}
console.log("");
