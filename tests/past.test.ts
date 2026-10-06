import { describe, expect, it } from "vitest";
import { pastCredit, sourceLabel } from "@/lib/format";
import { getMessages } from "@/lib/i18n";
import { isWithinPastWindow, levelFromCorrectRate, oldestPastYear } from "@/lib/past";
import {
  IMPORTANCE_BOOST,
  allocateChapters,
  buildLevelQuiz,
  buildMockExam,
  countAvailable,
  createRng,
  filterPool,
} from "@/lib/quiz-engine";
import { makeQuestion, makeSubject } from "./helpers";

describe("기출 수록 기준 (최근 10년)", () => {
  const now = new Date("2026-10-01");

  it("올해 포함 10년치만 수록한다", () => {
    expect(oldestPastYear(now)).toBe(2017);
    expect(isWithinPastWindow(2026, now)).toBe(true);
    expect(isWithinPastWindow(2017, now)).toBe(true);
    expect(isWithinPastWindow(2016, now)).toBe(false);
  });

  it("해가 바뀌면 기준 연도도 한 해 올라간다", () => {
    expect(oldestPastYear(new Date("2027-01-02"))).toBe(2018);
  });
});

describe("정답률로 난이도 정하기", () => {
  it("70% 이상 초급, 40% 이상 중급, 그 아래 고급", () => {
    expect(levelFromCorrectRate(85)).toBe("basic");
    expect(levelFromCorrectRate(70)).toBe("basic");
    expect(levelFromCorrectRate(69)).toBe("intermediate");
    expect(levelFromCorrectRate(40)).toBe("intermediate");
    expect(levelFromCorrectRate(39)).toBe("advanced");
  });
});

/**
 * 기출과 예상문제를 섞어 낸다 (사용자 결정 2026-10-06, PAST_MIX_RATIO).
 * 기출이 없으면 예상문제만, 기출이 모자라면 예상문제로 채운다.
 */
describe("난이도와 문제 출처", () => {
  const subjects = [makeSubject("a", 20, [["a1", 5, 100]])];
  const past = (level: "basic" | "intermediate" | "advanced", n: number) =>
    Array.from({ length: n }, () => makeQuestion("a", "a1", { level, source: "past" }));
  const predicted = (level: "basic" | "intermediate" | "advanced", n: number) =>
    Array.from({ length: n }, () => makeQuestion("a", "a1", { level, source: "predicted" }));

  it("초급·중급도 예상문제가 그대로 출제 범위에 들어간다", () => {
    const questions = [...predicted("basic", 20), ...predicted("intermediate", 20)];
    expect(countAvailable(questions, "basic")).toBe(20);
    expect(countAvailable(questions, "intermediate")).toBe(40);

    const quiz = buildLevelQuiz({ subjects, questions, level: "intermediate", count: 10, rng: createRng(1) });
    expect(quiz).toHaveLength(10);
    expect(quiz.every((q) => q.source === "predicted")).toBe(true);
  });

  it("기출 데이터가 섞여 있어도 예상문제를 걸러 내지 않는다", () => {
    const questions = [...past("basic", 3), ...predicted("basic", 20)];
    expect(filterPool(questions, "basic")).toHaveLength(23);
    const quiz = buildLevelQuiz({ subjects, questions, level: "basic", count: 5, rng: createRng(1) });
    expect(quiz).toHaveLength(5);
  });

  it("초급·중급·고급·실전 모두 기출과 예상문제가 반쯤씩 섞여 나온다", () => {
    for (const level of ["basic", "intermediate", "advanced"] as const) {
      const questions = [...past(level, 20), ...predicted(level, 20)];
      const quiz = buildLevelQuiz({ subjects, questions, level, count: 10, rng: createRng(3) });
      expect(quiz.filter((q) => q.source === "past").length, level).toBe(5);
    }
    const questions = [...past("advanced", 30), ...predicted("advanced", 30)];
    const exam = buildMockExam({ subjects, questions, totalQuestions: 20, rng: createRng(5) });
    expect(exam.filter((q) => q.source === "past").length).toBe(10);
  });

  it("기출이 모자라면 예상문제로 채운다", () => {
    const questions = [...past("basic", 2), ...predicted("basic", 20)];
    const quiz = buildLevelQuiz({ subjects, questions, level: "basic", count: 10, rng: createRng(1) });
    expect(quiz).toHaveLength(10);
    expect(quiz.filter((q) => q.source === "past")).toHaveLength(2);
  });

  it("고급은 예상문제만으로 요청한 수만큼 출제된다", () => {
    const questions = predicted("advanced", 40);
    const quiz = buildLevelQuiz({ subjects, questions, level: "advanced", count: 20, rng: createRng(7) });
    expect(quiz).toHaveLength(20);
  });
});

describe("중요 단원 가중치", () => {
  // 출제 비중은 같고 중요도만 다른 두 단원
  const subject = makeSubject("a", 20, [["low", 1, 50], ["high", 5, 50]]);

  it("가중치를 켜면 중요도 높은 단원에서 더 많이 나온다", () => {
    expect(allocateChapters(subject, 20)).toEqual([10, 10]);
    const boosted = allocateChapters(subject, 20, true);
    expect(boosted[1]).toBeGreaterThan(boosted[0]);
    expect(boosted[0] + boosted[1]).toBe(20);
    // 0.6 : 1.4 → 6 : 14
    expect(boosted).toEqual([6, 14]);
    expect(IMPORTANCE_BOOST[5]).toBeGreaterThan(IMPORTANCE_BOOST[1]);
  });

  it("풀 때마다 다른 문제가 나온다 (같은 단원 안에서 무작위)", () => {
    const subjects = [makeSubject("a", 20, [["a1", 5, 100]])];
    const questions = Array.from({ length: 40 }, () => makeQuestion("a", "a1", { source: "past" }));
    const first = buildLevelQuiz({ subjects, questions, level: "basic", count: 5, rng: createRng(1) }).map((q) => q.id);
    const second = buildLevelQuiz({ subjects, questions, level: "basic", count: 5, rng: createRng(2) }).map((q) => q.id);
    expect(first).not.toEqual(second);
  });
});

describe("기출 배지·출처 표기", () => {
  const m = getMessages("ko");
  const info = { year: 2025, round: 36, roundName: "제36회", issuer: "시행기관", license: "공공누리 제1유형(출처표시)" };

  it("실제 회차 명칭으로 배지를 만든다", () => {
    expect(sourceLabel({ source: "past", pastInfo: info }, m)).toBe("2025년 제36회 기출");
    expect(sourceLabel({ source: "past", pastInfo: { year: 2023, round: 2 } }, m)).toBe("2023년 2회 기출");
    expect(sourceLabel({ source: "predicted" }, m)).toBe("예상문제");
  });

  it("기출에는 출처·이용 조건 한 줄이 붙고, 예상문제에는 없다", () => {
    expect(pastCredit({ source: "past", pastInfo: info }, m)).toBe(
      "출처: 시행기관 2025년 제36회 시험문제 · 이용 조건: 공공누리 제1유형(출처표시)",
    );
    expect(pastCredit({ source: "past", pastInfo: { ...info, item: "1과목 3번" } }, m)).toBe(
      "출처: 시행기관 2025년 제36회 시험문제 1과목 3번 · 이용 조건: 공공누리 제1유형(출처표시)",
    );
    expect(pastCredit({ source: "past", pastInfo: { ...info, item: "1과목 3번" } }, m, false)).toBe(
      "출처: 시행기관 2025년 제36회 시험문제 · 이용 조건: 공공누리 제1유형(출처표시)",
    );
    expect(pastCredit({ source: "predicted" }, m)).toBeNull();
  });
});
