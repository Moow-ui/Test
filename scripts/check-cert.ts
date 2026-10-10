/**
 * 자격증 한 개의 게시 기준 검사.
 *   npm run check:cert -- {slug}
 *
 * 검사 항목 (하나라도 모자라면 실패)
 *   1. 초급·중급·고급에서 각각 풀 수 있는 문제가 30개 이상인가 (같은 문제가 여러 난이도에 쓰여도 된다)
 *   2. 실전 문제풀이 를 1회분 이상 낼 수 있는가 (과목마다 실제 문항 수 이상)
 * 경고만 (실패는 아님)
 *   - meta.json 에 addedAt(추가한 날)이 없다 → 사이트 하단 "기록" 페이지에 안 나온다.
 *     새로 추가하는 자격증이면 오늘 날짜(한국시간)를 적는다. 루틴 전부터 있던 자격증 보강이면 그대로 둔다.
 */
import { getAddedLog, getCertification, getQuestions } from "../lib/data";
import { countAvailable, mockExamShortage } from "../lib/quiz-engine";
import type { QuizLevel } from "../lib/types";

const MIN_PER_LEVEL = 30;
const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error("사용법: npm run check:cert -- {slug}");
    process.exit(1);
  }
  const cert = await getCertification(slug);
  if (!cert) {
    console.error(`자격증을 찾을 수 없습니다: ${slug}`);
    process.exit(1);
  }
  const questions = await getQuestions(slug);
  const errors: string[] = [];

  console.log(`[${cert.name}] 문제 ${questions.length}개`);
  for (const level of LEVELS) {
    const count = countAvailable(questions, level);
    console.log(`  ${level}: ${count}개`);
    if (count < MIN_PER_LEVEL) errors.push(`${level} 에서 풀 수 있는 문제가 ${count}개 (최소 ${MIN_PER_LEVEL}개)`);
  }

  const shortage = mockExamShortage(cert.subjects, questions);
  if (cert.subjects.length === 0) errors.push("과목(chapters.json)이 없음");
  for (const s of shortage) errors.push(`실전 문제풀이 문제 부족: ${s.subjectId} ${s.have}/${s.need}`);
  console.log(`  실전 문제풀이: ${shortage.length === 0 && cert.subjects.length > 0 ? "낼 수 있음" : "낼 수 없음"}`);

  const log = await getAddedLog(cert.country);
  if (!log.some((e) => e.certs.some((c) => c.id === slug))) {
    console.warn(`\n⚠ meta.json 에 addedAt 이 없습니다. 새로 추가하는 자격증이면 오늘 날짜(한국시간)를 적으세요 ("기록" 페이지에 나옵니다).`);
  }

  if (errors.length > 0) {
    console.error(`\n게시 기준 미달 ${errors.length}건`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log("\n게시 기준 통과 ✓");
}

void main();
