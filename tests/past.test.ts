import { describe, expect, it } from "vitest";
import { isWithinPastWindow, levelFromCorrectRate, oldestPastYear } from "@/lib/past";
import {
  IMPORTANCE_BOOST,
  allocateChapters,
  buildLevelQuiz,
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

describe("초급·중급은 기출만", () => {
  const subjects = [makeSubject("a", 20, [["a1", 5, 100]])];
  const past = (level: "basic" | "intermediate" | "advanced", n: number) =>
    Array.from({ length: n }, () => makeQuestion("a", "a1", { level, source: "past" }));
  const predicted = (level: "basic" | "intermediate" | "advanced", n: number) =>
    Array.from({ length: n }, () => makeQuestion("a", "a1", { level, source: "predicted" }));

  it("기출이 등록된 자격증은 초급·중급에서 예상문제가 나오지 않는다", () => {
    const questions = [...past("basic", 6), ...predicted("basic", 20), ...past("intermediate", 4), ...predicted("intermediate", 20)];
    expect(filterPool(questions, "basic").every((q) => q.source === "past")).toBe(true);
    expect(countAvailable(questions, "basic")).toBe(6);
    expect(countAvailable(questions, "intermediate")).toBe(10);

    const quiz = buildLevelQuiz({ subjects, questions, level: "intermediate", count: 10, rng: createRng(1) });
    expect(quiz).toHaveLength(10);
    expect(quiz.every((q) => q.source === "past")).toBe(true);
  });

  it("기출이 모자라면 예상문제로 채우지 않고 그만큼만 출제된다 (화면에서는 버튼이 비활성화)", () => {
    const questions = [...past("basic", 3), ...predicted("basic", 20)];
    const quiz = buildLevelQuiz({ subjects, questions, level: "basic", count: 5, rng: createRng(1) });
    expect(quiz).toHaveLength(3);
  });

  it("기출이 하나도 없는 자격증은 예상문제로 대신한다", () => {
    const questions = predicted("basic", 8);
    expect(countAvailable(questions, "basic")).toBe(8);
  });

  it("고급은 기출과 예상문제를 반반 섞는다", () => {
    const questions = [...past("advanced", 20), ...predicted("advanced", 20)];
    const quiz = buildLevelQuiz({ subjects, questions, level: "advanced", count: 20, rng: createRng(7) });
    expect(quiz.filter((q) => q.source === "past")).toHaveLength(10);
    expect(quiz.filter((q) => q.source === "predicted")).toHaveLength(10);
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
