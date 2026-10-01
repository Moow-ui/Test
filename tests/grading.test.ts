import { describe, expect, it } from "vitest";
import { gradeQuiz, judgePass, summarize, type GroupStat } from "@/lib/grading";
import type { ExamInfo, Question } from "@/lib/types";
import { makeQuestion, makeSubject } from "./helpers";

const subjects = [
  makeSubject("a", 20, [["a1", 5, 60], ["a2", 3, 40]]),
  makeSubject("b", 20, [["b1", 4, 100]]),
  makeSubject("c", 20, [["c1", 4, 100]]),
];

function examInfo(subjectMinScore: number | null): ExamInfo {
  return {
    totalQuestions: 60,
    timeLimitMinutes: 60,
    format: "객관식",
    passCriteria: { averageScore: 60, subjectMinScore, description: "설명" },
  };
}

/** 과목별 [정답 수, 전체 수] 로 문제와 답안을 만든다 */
function makeSession(spec: Array<[subjectId: string, chapterId: string, correct: number, total: number]>) {
  const questions: Question[] = [];
  const answers: Record<string, number> = {};
  for (const [subjectId, chapterId, correct, total] of spec) {
    for (let i = 0; i < total; i++) {
      const q = makeQuestion(subjectId, chapterId, { answer: 2 });
      questions.push(q);
      answers[q.id] = i < correct ? 2 : 3;
    }
  }
  return { questions, answers };
}

const stat = (id: string, correct: number, total: number): GroupStat => ({
  id,
  name: id,
  total,
  correct,
  score: (correct / total) * 100,
});

describe("채점", () => {
  it("고른 답과 정답이 같으면 정답, 안 푼 문제는 오답", () => {
    const q1 = makeQuestion("a", "a1", { answer: 3 });
    const q2 = makeQuestion("a", "a1", { answer: 1 });
    const q3 = makeQuestion("a", "a1", { answer: 4 });
    const graded = gradeQuiz([q1, q2, q3], { [q1.id]: 3, [q2.id]: 2 });
    expect(graded.map((g) => g.correct)).toEqual([true, false, false]);
    expect(graded[2].chosen).toBeNull();
  });
});

describe("합격 판정 - 과락 없는 시험 (기능사)", () => {
  const criteria = examInfo(null).passCriteria;

  it("60문항 중 36문항(60점)이면 합격, 35문항이면 불합격", () => {
    expect(judgePass(criteria, [], (36 / 60) * 100).passed).toBe(true);
    expect(judgePass(criteria, [], (35 / 60) * 100).passed).toBe(false);
  });

  it("한 과목이 0점이어도 전체 60점 이상이면 합격", () => {
    const { questions, answers } = makeSession([
      ["a", "a1", 0, 20],
      ["b", "b1", 18, 20],
      ["c", "c1", 18, 20],
    ]);
    const summary = summarize(gradeQuiz(questions, answers), { subjects, examInfo: examInfo(null) });
    expect(summary.score).toBe(60);
    expect(summary.verdict?.passed).toBe(true);
    expect(summary.verdict?.failedSubjects).toEqual([]);
  });
});

describe("합격 판정 - 과락 있는 시험 (산업기사·기사)", () => {
  const criteria = examInfo(40).passCriteria;

  it("평균 60점 이상이고 과락이 없으면 합격", () => {
    const verdict = judgePass(criteria, [stat("a", 12, 20), stat("b", 12, 20), stat("c", 12, 20)], 60);
    expect(verdict.passed).toBe(true);
    expect(verdict.averageScore).toBe(60);
  });

  it("평균이 60점을 넘어도 한 과목이 40점 미만이면 불합격 (과락)", () => {
    const verdict = judgePass(criteria, [stat("a", 7, 20), stat("b", 18, 20), stat("c", 18, 20)], 71.7);
    expect(verdict.passed).toBe(false);
    expect(verdict.failedSubjects.map((s) => s.id)).toEqual(["a"]);
  });

  it("딱 40점인 과목은 과락이 아니다", () => {
    const verdict = judgePass(criteria, [stat("a", 8, 20), stat("b", 16, 20), stat("c", 16, 20)], 66.7);
    expect(verdict.failedSubjects).toEqual([]);
    expect(verdict.passed).toBe(true);
  });

  it("과락이 없어도 평균이 60점 미만이면 불합격", () => {
    const verdict = judgePass(criteria, [stat("a", 10, 20), stat("b", 11, 20), stat("c", 11, 20)], 53.3);
    expect(verdict.passed).toBe(false);
    expect(verdict.failedSubjects).toEqual([]);
  });

  it("이번 풀이에 나오지 않은 과목은 판정에서 뺀다", () => {
    const verdict = judgePass(criteria, [stat("a", 4, 5), { ...stat("b", 0, 1), total: 0, score: 0 }], 80);
    expect(verdict.passed).toBe(true);
  });
});

describe("결과 요약", () => {
  it("과목별·단원별 정답률과 약점 단원 상위 3개를 계산한다", () => {
    const { questions, answers } = makeSession([
      ["a", "a1", 1, 4], // 25%
      ["a", "a2", 2, 2], // 100% → 약점 아님
      ["b", "b1", 1, 2], // 50%
      ["c", "c1", 0, 2], // 0%
    ]);
    const summary = summarize(gradeQuiz(questions, answers), { subjects, examInfo: examInfo(null) });

    expect(summary.total).toBe(10);
    expect(summary.correct).toBe(4);
    expect(summary.score).toBe(40);
    expect(summary.bySubject.map((s) => [s.id, s.correct, s.total])).toEqual([
      ["a", 3, 6],
      ["b", 1, 2],
      ["c", 0, 2],
    ]);
    expect(summary.weakChapters.map((c) => c.id)).toEqual(["c1", "a1", "b1"]);
    expect(summary.verdict?.passed).toBe(false);
  });

  it("전부 맞히면 약점 단원이 없다", () => {
    const { questions, answers } = makeSession([["a", "a1", 5, 5]]);
    const summary = summarize(gradeQuiz(questions, answers), { subjects, examInfo: examInfo(null) });
    expect(summary.weakChapters).toEqual([]);
    expect(summary.verdict?.passed).toBe(true);
  });
});
