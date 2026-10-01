/** 기출문제 수록 기준 */

/** 최근 몇 년치 기출만 수록할지 */
export const PAST_WINDOW_YEARS = 10;

/** 수록 대상이 되는 가장 오래된 연도 (올해가 2026년이면 2017년) */
export function oldestPastYear(now: Date = new Date()): number {
  return now.getFullYear() - PAST_WINDOW_YEARS + 1;
}

/** 최근 10년 안의 기출인가 */
export function isWithinPastWindow(year: number, now: Date = new Date()): boolean {
  return year >= oldestPastYear(now);
}

/**
 * 기출의 난이도를 정답률(%)로 추정한다.
 * 정답률이 높을수록 쉬운 문제: 70% 이상 초급, 40% 이상 중급, 그 아래는 고급.
 */
export const LEVEL_BY_CORRECT_RATE = { basic: 70, intermediate: 40 } as const;

export function levelFromCorrectRate(rate: number): "basic" | "intermediate" | "advanced" {
  if (rate >= LEVEL_BY_CORRECT_RATE.basic) return "basic";
  if (rate >= LEVEL_BY_CORRECT_RATE.intermediate) return "intermediate";
  return "advanced";
}
