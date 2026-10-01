/**
 * 중요도(★)와 합격 기여도(%) 계산.
 *
 * 이 두 값의 계산식은 반드시 이 파일에만 둔다. (화면·다른 lib 에서 따로 계산하지 말 것)
 * 계수를 바꾸고 싶으면 아래 SCORING 상수만 고치면 된다.
 */

export const SCORING = {
  /** 중요도 ★ = round(IMPORTANCE_WEIGHT × 단원 importance + FREQUENCY_WEIGHT × 문제 frequency) */
  IMPORTANCE_WEIGHT: 0.6,
  FREQUENCY_WEIGHT: 0.4,
  STAR_MIN: 1,
  STAR_MAX: 5,

  /**
   * 합격 기여도 %. 화면에는 "이 문제를 맞혔다면 합격 가능성은? N%" 로 보인다.
   * = BASE + (★ − 1) × PER_STAR + (frequency ≥ HIGH_FREQ_THRESHOLD ? HIGH_FREQ_BONUS : 0)
   */
  PASS_BASE: 50,
  PASS_PER_STAR: 10,
  HIGH_FREQ_THRESHOLD: 4,
  HIGH_FREQ_BONUS: 5,
  PASS_MAX: 95,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 중요도 ★ (1~5) */
export function calcStars(chapterImportance: number, frequency: number): number {
  const raw =
    SCORING.IMPORTANCE_WEIGHT * chapterImportance + SCORING.FREQUENCY_WEIGHT * frequency;
  return clamp(Math.round(raw), SCORING.STAR_MIN, SCORING.STAR_MAX);
}

export interface ScoringInput {
  questionId: string;
  chapterImportance: number;
  frequency: number;
}

export interface PassContribution {
  /** 0~100 % */
  value: number;
  /** true 면 공식으로 계산한 추정치, false 면 실사용자 데이터로 측정한 값 */
  isEstimate: boolean;
}

/**
 * 합격 기여도를 내놓는 쪽의 인터페이스.
 * 나중에 실사용자 데이터(이 문제 정답자 중 모의고사 합격선을 넘은 비율)가 쌓이면
 * 이 인터페이스를 구현한 provider 를 하나 더 만들어 getPassContribution 에 넘기면 된다.
 */
export interface PassContributionProvider {
  get(input: ScoringInput): PassContribution | null;
}

/** MVP 추정 공식 */
export const estimatedPassContribution: PassContributionProvider = {
  get({ chapterImportance, frequency }) {
    const stars = calcStars(chapterImportance, frequency);
    const bonus = frequency >= SCORING.HIGH_FREQ_THRESHOLD ? SCORING.HIGH_FREQ_BONUS : 0;
    const value = SCORING.PASS_BASE + (stars - 1) * SCORING.PASS_PER_STAR + bonus;
    return { value: Math.min(SCORING.PASS_MAX, value), isEstimate: true };
  },
};

/**
 * 합격 기여도 %.
 * provider 가 값을 못 주면(null) 추정 공식으로 대신 계산한다.
 */
export function getPassContribution(
  input: ScoringInput,
  provider: PassContributionProvider = estimatedPassContribution,
): PassContribution {
  return provider.get(input) ?? estimatedPassContribution.get(input)!;
}
