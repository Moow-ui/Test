import { describe, expect, it } from "vitest";
import {
  LEVEL_RULES,
  QUIZ_COUNTS,
  allocateChapters,
  allocateQuestions,
  allocateSubjects,
  buildLevelQuiz,
  buildMockExam,
  buildQuiz,
  countAvailable,
  createRng,
  filterPool,
  largestRemainder,
  mockExamSeconds,
} from "@/lib/quiz-engine";
import { SAMPLE_SUBJECTS, makeQuestion, makeQuestionsFor, makeSubject } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

describe("largestRemainder (최대 잔여법)", () => {
  it("합계가 항상 요청 수와 같다", () => {
    for (let total = 0; total <= 40; total++) {
      const result = largestRemainder([25, 15, 20, 25, 10, 5], total);
      expect(result.reduce((a, b) => a + b, 0)).toBe(total);
    }
  });

  it("비율이 딱 떨어지면 그대로 배분한다", () => {
    expect(largestRemainder([25, 15, 20, 25, 10, 5], 20)).toEqual([5, 3, 4, 5, 2, 1]);
  });

  it("소수 부분이 큰 쪽이 남은 자리를 받는다", () => {
    // 몫 3.33 / 3.33 / 3.33 → 3,3,3 + 남은 1 자리는 우선순위가 가장 높은 쪽
    expect(largestRemainder([1, 1, 1], 10, [2, 0, 1])).toEqual([3, 4, 3]);
    // 몫 1.5 / 4.5 / 3 → 소수 부분이 같으면 priority 가 작은 쪽
    expect(largestRemainder([1, 3, 2], 9, [1, 0, 2])).toEqual([1, 5, 3]);
  });
});

describe("문항 배분", () => {
  it("배분 합계 = 요청 문항 수 (모든 문항 수 조합)", () => {
    for (const count of [1, 2, 3, 5, 7, 10, 13, 20, 30, 45, 60]) {
      for (let seed = 1; seed <= 20; seed++) {
        const alloc = allocateQuestions(SAMPLE_SUBJECTS, count, createRng(seed));
        expect(alloc.reduce((sum, a) => sum + a.count, 0)).toBe(count);
      }
    }
  });

  it("60문항이면 실제 시험처럼 과목별 20문항, 단원은 출제 비중대로 나뉜다", () => {
    const alloc = allocateQuestions(SAMPLE_SUBJECTS, 60, createRng(1));
    const byChapter = Object.fromEntries(alloc.map((a) => [a.chapterId, a.count]));
    expect(byChapter).toEqual({
      t1: 5, t2: 3, t3: 4, t4: 5, t5: 2, t6: 1,
      m1: 5, m2: 4, m3: 5, m4: 4, m5: 2,
      f1: 3, f2: 2, f3: 5, f4: 4, f5: 3, f6: 3,
    });
  });

  it("과목별 문항 수는 과목의 시험 문항 수 비율을 따른다", () => {
    const subjects = [
      makeSubject("a", 40, [["a1", 3, 100]]),
      makeSubject("b", 20, [["b1", 3, 100]]),
    ];
    expect(allocateSubjects(subjects, 30, createRng(1))).toEqual([20, 10]);
    expect(allocateSubjects(subjects, 6, createRng(1))).toEqual([4, 2]);
  });

  it("과목 간 배분 차이는 1문제를 넘지 않는다 (문항 수가 같은 과목일 때)", () => {
    for (const count of QUIZ_COUNTS) {
      for (let seed = 1; seed <= 20; seed++) {
        const perSubject = allocateSubjects(SAMPLE_SUBJECTS, count, createRng(seed));
        expect(Math.max(...perSubject) - Math.min(...perSubject)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("문항 수가 적으면 중요도 높은 단원부터 1문제씩 배정한다", () => {
    const [theory] = SAMPLE_SUBJECTS;
    // 중요도 5: t1, t4 / 중요도 4: t3(비중 20), t2(비중 15)
    expect(allocateChapters(theory, 2)).toEqual([1, 0, 0, 1, 0, 0]);
    expect(allocateChapters(theory, 3)).toEqual([1, 0, 1, 1, 0, 0]);
    expect(allocateChapters(theory, 4)).toEqual([1, 1, 1, 1, 0, 0]);
  });

  it("문항 수가 충분하면 단원 출제 비중에 비례한다", () => {
    const [theory] = SAMPLE_SUBJECTS;
    expect(allocateChapters(theory, 20)).toEqual([5, 3, 4, 5, 2, 1]);
    expect(allocateChapters(theory, 40)).toEqual([10, 6, 8, 10, 4, 2]);
    const ten = allocateChapters(theory, 10);
    expect(ten.reduce((a, b) => a + b, 0)).toBe(10);
    // 비중 25% 단원이 비중 5% 단원보다 많이 받는다
    expect(ten[0]).toBeGreaterThan(ten[5]);
  });
});

describe("buildQuiz (문제 뽑기)", () => {
  const pool = makeQuestionsFor(SAMPLE_SUBJECTS, 6);

  it("요청한 수만큼, 중복 없이 뽑는다", () => {
    for (const count of QUIZ_COUNTS) {
      for (let seed = 1; seed <= 10; seed++) {
        const quiz = buildQuiz({ subjects: SAMPLE_SUBJECTS, pool, count, rng: createRng(seed) });
        expect(quiz).toHaveLength(count);
        expect(new Set(quiz.map((q) => q.id)).size).toBe(count);
      }
    }
  });

  it("뽑힌 문제의 단원 분포가 배분 결과와 같다 (문제가 충분할 때)", () => {
    const bigPool = makeQuestionsFor(SAMPLE_SUBJECTS, 12);
    const quiz = buildQuiz({ subjects: SAMPLE_SUBJECTS, pool: bigPool, count: 60, rng: createRng(3) });
    const counts: Record<string, number> = {};
    for (const q of quiz) counts[q.chapterId] = (counts[q.chapterId] ?? 0) + 1;
    expect(counts).toEqual({
      t1: 5, t2: 3, t3: 4, t4: 5, t5: 2, t6: 1,
      m1: 5, m2: 4, m3: 5, m4: 4, m5: 2,
      f1: 3, f2: 2, f3: 5, f4: 4, f5: 3, f6: 3,
    });
  });

  it("보유 문제가 요청보다 적으면 있는 만큼만 돌려준다", () => {
    const small = pool.slice(0, 7);
    const quiz = buildQuiz({ subjects: SAMPLE_SUBJECTS, pool: small, count: 20, rng: createRng(1) });
    expect(quiz).toHaveLength(7);
  });

  it("단원에 문제가 모자라면 같은 과목의 다른 단원에서 채운다", () => {
    const subjects = [
      makeSubject("a", 10, [["a1", 5, 80], ["a2", 3, 20]]),
      makeSubject("b", 10, [["b1", 4, 100]]),
    ];
    const questions = [
      makeQuestion("a", "a1"),
      ...Array.from({ length: 10 }, () => makeQuestion("a", "a2")),
      ...Array.from({ length: 10 }, () => makeQuestion("b", "b1")),
    ];
    const quiz = buildQuiz({ subjects, pool: questions, count: 10, rng: createRng(5) });
    expect(quiz).toHaveLength(10);
    // a 과목 5문제: a1 은 1문제뿐이므로 나머지 4문제는 a2 에서 채워져야 한다
    expect(quiz.filter((q) => q.subjectId === "a")).toHaveLength(5);
    expect(quiz.filter((q) => q.chapterId === "a1")).toHaveLength(1);
    expect(quiz.filter((q) => q.chapterId === "a2")).toHaveLength(4);
    expect(quiz.filter((q) => q.subjectId === "b")).toHaveLength(5);
  });

  it("최근 7일 안에 푼 문제는 뒤로 미룬다", () => {
    const subjects = [makeSubject("a", 10, [["a1", 5, 100]])];
    const questions = Array.from({ length: 10 }, () => makeQuestion("a", "a1"));
    const recentIds = questions.slice(0, 5).map((q) => q.id);
    const history = Object.fromEntries(recentIds.map((id) => [id, { lastSolvedAt: NOW - 2 * DAY }]));

    for (let seed = 1; seed <= 10; seed++) {
      const quiz = buildQuiz({ subjects, pool: questions, count: 5, history, now: NOW, rng: createRng(seed) });
      expect(quiz.some((q) => recentIds.includes(q.id))).toBe(false);
    }
    // 안 푼 문제가 모자라면 최근 푼 문제도 나온다
    const quiz = buildQuiz({ subjects, pool: questions, count: 8, history, now: NOW, rng: createRng(1) });
    expect(quiz).toHaveLength(8);
    expect(quiz.filter((q) => recentIds.includes(q.id))).toHaveLength(3);
  });

  it("7일이 지난 풀이 기록은 다시 일반 문제로 취급한다", () => {
    const subjects = [makeSubject("a", 10, [["a1", 5, 100]])];
    const questions = Array.from({ length: 6 }, () => makeQuestion("a", "a1"));
    const oldIds = questions.slice(0, 3).map((q) => q.id);
    const history = Object.fromEntries(oldIds.map((id) => [id, { lastSolvedAt: NOW - 8 * DAY }]));
    let sawOld = false;
    for (let seed = 1; seed <= 20; seed++) {
      const quiz = buildQuiz({ subjects, pool: questions, count: 3, history, now: NOW, rng: createRng(seed) });
      if (quiz.some((q) => oldIds.includes(q.id))) sawOld = true;
    }
    expect(sawOld).toBe(true);
  });

  it("결과는 과목 순서대로 묶여 있다", () => {
    const quiz = buildQuiz({ subjects: SAMPLE_SUBJECTS, pool, count: 30, rng: createRng(2) });
    const order = quiz.map((q) => SAMPLE_SUBJECTS.findIndex((s) => s.id === q.subjectId));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("난이도 카드", () => {
  const subjects = [makeSubject("a", 20, [["a1", 5, 100]])];
  const questions = [
    ...Array.from({ length: 10 }, () => makeQuestion("a", "a1", { level: "basic" })),
    ...Array.from({ length: 10 }, () => makeQuestion("a", "a1", { level: "intermediate" })),
    ...Array.from({ length: 10 }, () => makeQuestion("a", "a1", { level: "advanced" })),
  ];

  it("초급은 basic 만, 중급은 basic+intermediate, 고급은 intermediate+advanced", () => {
    expect(filterPool(questions, "basic").every((q) => q.level === "basic")).toBe(true);
    expect(countAvailable(questions, "basic")).toBe(10);
    expect(countAvailable(questions, "intermediate")).toBe(20);
    expect(countAvailable(questions, "advanced")).toBe(20);
    expect(filterPool(questions, "advanced").some((q) => q.level === "basic")).toBe(false);
  });

  it("특정 과목만 고르면 그 과목 문제만 나온다", () => {
    const pool = makeQuestionsFor(SAMPLE_SUBJECTS, 5);
    const quiz = buildLevelQuiz({
      subjects: SAMPLE_SUBJECTS,
      questions: pool,
      level: "basic",
      count: 10,
      subjectId: "machines",
      rng: createRng(1),
    });
    expect(quiz).toHaveLength(10);
    expect(quiz.every((q) => q.subjectId === "machines")).toBe(true);
  });

  it("고급은 기출과 예상문제를 50:50 으로 섞는다", () => {
    const mixed = [
      ...Array.from({ length: 20 }, () => makeQuestion("a", "a1", { level: "advanced", source: "past" })),
      ...Array.from({ length: 20 }, () => makeQuestion("a", "a1", { level: "advanced", source: "predicted" })),
    ];
    expect(LEVEL_RULES.advanced.pastRatio).toBe(0.5);
    for (const count of [10, 20, 30]) {
      const quiz = buildLevelQuiz({ subjects, questions: mixed, level: "advanced", count, rng: createRng(count) });
      expect(quiz.filter((q) => q.source === "past")).toHaveLength(count / 2);
    }
  });

  it("초급·중급은 기출만 쓴다 (기출이 있는 자격증에서는 예상문제로 채우지 않는다)", () => {
    const mixed = [
      ...Array.from({ length: 3 }, () => makeQuestion("a", "a1", { level: "basic", source: "past" })),
      ...Array.from({ length: 10 }, () => makeQuestion("a", "a1", { level: "basic", source: "predicted" })),
    ];
    const quiz = buildLevelQuiz({ subjects, questions: mixed, level: "basic", count: 5, rng: createRng(1) });
    expect(quiz).toHaveLength(3);
    expect(quiz.every((q) => q.source === "past")).toBe(true);
  });

  it("기출이 하나도 없어도 예상문제만으로 출제된다", () => {
    const quiz = buildLevelQuiz({ subjects, questions, level: "advanced", count: 10, rng: createRng(1) });
    expect(quiz).toHaveLength(10);
  });
});

describe("실전 CBT 모의고사", () => {
  it("과목별 문항 수가 실제 시험과 같다", () => {
    const pool = makeQuestionsFor(SAMPLE_SUBJECTS, 8);
    const exam = buildMockExam({ subjects: SAMPLE_SUBJECTS, questions: pool, totalQuestions: 60, rng: createRng(1) });
    expect(exam).toHaveLength(60);
    for (const s of SAMPLE_SUBJECTS) {
      expect(exam.filter((q) => q.subjectId === s.id)).toHaveLength(20);
    }
  });

  it("제한 시간은 문항 수 비율로 줄어든다", () => {
    const examInfo = { totalQuestions: 60, timeLimitMinutes: 60 };
    expect(mockExamSeconds(60, examInfo)).toBe(3600);
    expect(mockExamSeconds(30, examInfo)).toBe(1800);
    expect(mockExamSeconds(90, examInfo)).toBe(3600);
  });
});
