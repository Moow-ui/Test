import { describe, expect, it } from "vitest";
import {
  SCORING,
  calcStars,
  estimatedPassContribution,
  getPassContribution,
  type PassContributionProvider,
} from "@/lib/scoring";

describe("중요도 ★", () => {
  it("round(0.6 × 단원 중요도 + 0.4 × 출제 빈도)", () => {
    expect(calcStars(5, 5)).toBe(5);
    expect(calcStars(1, 1)).toBe(1);
    expect(calcStars(5, 3)).toBe(4); // 3.0 + 1.2 = 4.2
    expect(calcStars(3, 5)).toBe(4); // 1.8 + 2.0 = 3.8
    expect(calcStars(4, 2)).toBe(3); // 2.4 + 0.8 = 3.2
    expect(calcStars(2, 5)).toBe(3); // 1.2 + 2.0 = 3.2
    expect(calcStars(3, 2)).toBe(3); // 1.8 + 0.8 = 2.6
  });

  it("항상 1~5 범위 안이다", () => {
    for (let importance = 1; importance <= 5; importance++) {
      for (let frequency = 1; frequency <= 5; frequency++) {
        const stars = calcStars(importance, frequency);
        expect(stars).toBeGreaterThanOrEqual(SCORING.STAR_MIN);
        expect(stars).toBeLessThanOrEqual(SCORING.STAR_MAX);
      }
    }
    expect(calcStars(9, 9)).toBe(5);
    expect(calcStars(0, 0)).toBe(1);
  });
});

describe("합격 기여도 %", () => {
  const contribution = (chapterImportance: number, frequency: number) =>
    getPassContribution({ questionId: "q", chapterImportance, frequency });

  it("50 + (★ − 1) × 10 + (빈도 4 이상이면 5)", () => {
    expect(contribution(1, 1).value).toBe(50); // ★1
    expect(contribution(3, 3).value).toBe(70); // ★3
    expect(contribution(5, 3).value).toBe(80); // ★4, 빈도 3
    expect(contribution(4, 4).value).toBe(85); // ★4, 빈도 4 → +5
    expect(contribution(5, 5).value).toBe(95); // ★5 → 90 + 5
  });

  it("최대 95% 를 넘지 않는다", () => {
    for (let importance = 1; importance <= 5; importance++) {
      for (let frequency = 1; frequency <= 5; frequency++) {
        expect(contribution(importance, frequency).value).toBeLessThanOrEqual(SCORING.PASS_MAX);
      }
    }
  });

  it("공식으로 구한 값은 추정치로 표시된다", () => {
    expect(contribution(3, 3).isEstimate).toBe(true);
    expect(estimatedPassContribution.get({ questionId: "q", chapterImportance: 3, frequency: 3 })?.isEstimate).toBe(true);
  });

  it("실측 provider 를 넘기면 그 값을 쓰고, 값이 없으면 추정 공식으로 돌아간다", () => {
    const measured: PassContributionProvider = {
      get: ({ questionId }) => (questionId === "known" ? { value: 73, isEstimate: false } : null),
    };
    expect(getPassContribution({ questionId: "known", chapterImportance: 1, frequency: 1 }, measured)).toEqual({
      value: 73,
      isEstimate: false,
    });
    expect(getPassContribution({ questionId: "other", chapterImportance: 1, frequency: 1 }, measured)).toEqual({
      value: 50,
      isEstimate: true,
    });
  });
});
