import type { Level, Question, Source, Subject } from "@/lib/types";

/** 테스트용 과목·문제 생성 도우미 */

export function makeSubject(
  id: string,
  questionCount: number,
  chapters: Array<[id: string, importance: number, examWeight: number]>,
): Subject {
  return {
    id,
    name: id,
    questionCount,
    chapters: chapters.map(([cid, importance, examWeight]) => ({
      id: cid,
      name: cid,
      importance,
      examWeight,
      summary: "요약",
      keyPoints: [],
    })),
  };
}

let seq = 0;

export function makeQuestion(
  subjectId: string,
  chapterId: string,
  overrides: Partial<Question> & { level?: Level; source?: Source } = {},
): Question {
  seq += 1;
  const source = overrides.source ?? "predicted";
  return {
    id: `q${seq}`,
    certId: "test-cert",
    subjectId,
    chapterId,
    source,
    ...(source === "past" ? { pastInfo: { year: 2023, round: 1 } } : {}),
    level: "basic",
    stem: `문제 ${seq}`,
    choices: ["가", "나", "다", "라"],
    answer: 1,
    oneLineConcept: "핵심",
    explanation: "해설",
    frequency: 3,
    reviewStatus: "unverified",
    tags: [],
    version: 1,
    retired: false,
    ...overrides,
  };
}

/** 단원마다 n 문제씩 만든다 */
export function makeQuestionsFor(
  subjects: Subject[],
  perChapter: number,
  overrides: Partial<Question> = {},
): Question[] {
  const result: Question[] = [];
  for (const s of subjects) {
    for (const c of s.chapters) {
      for (let i = 0; i < perChapter; i++) result.push(makeQuestion(s.id, c.id, overrides));
    }
  }
  return result;
}

export const SAMPLE_SUBJECTS: Subject[] = [
  makeSubject("theory", 20, [
    ["t1", 5, 25],
    ["t2", 4, 15],
    ["t3", 4, 20],
    ["t4", 5, 25],
    ["t5", 3, 10],
    ["t6", 2, 5],
  ]),
  makeSubject("machines", 20, [
    ["m1", 4, 25],
    ["m2", 4, 20],
    ["m3", 5, 25],
    ["m4", 5, 20],
    ["m5", 3, 10],
  ]),
  makeSubject("facilities", 20, [
    ["f1", 3, 15],
    ["f2", 3, 10],
    ["f3", 5, 25],
    ["f4", 5, 20],
    ["f5", 3, 15],
    ["f6", 3, 15],
  ]),
];
