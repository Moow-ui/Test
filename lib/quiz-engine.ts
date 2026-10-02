import type { Level, QuestionKey, QuizLevel, Subject } from "./types";

/**
 * 출제 엔진.
 *
 * 1) 과목별 문항 수: 요청 문항 수를 과목의 실제 시험 문항 수(questionCount) 비율로 나눈다.
 * 2) 단원별 문항 수: 과목 안에서 단원 출제 비중(examWeight) 비율로 나눈다.
 *    → 결과적으로 "examWeight × 과목 문항 비율"에 비례한다.
 *    반올림 오차는 최대 잔여법(largest remainder)으로 처리한다.
 *    연습 풀이(초급/중급/고급)에서는 중요한 단원이 더 자주 나오도록 중요도 가중치(IMPORTANCE_BOOST)를 곱한다.
 * 3) 문항 수가 적어 과목에 배정된 수가 단원 수보다 적으면 중요도 높은 단원부터 1문제씩 배정한다.
 * 4) 단원 안에서는 매번 무작위로 뽑는다. 같은 세션 안에서는 중복 없이 뽑고, 최근 7일 안에 푼 문제는 뒤로 미룬다.
 * 5) 단원에 문제가 모자라면 같은 과목의 다른 단원에서 채운다.
 *
 * 화면과 무관한 순수 함수만 둔다. (tests/quiz-engine.test.ts 참고)
 * 문제의 내용은 보지 않고 QuestionKey(id·과목·단원·난이도·출처)만 쓴다.
 * 그래서 브라우저는 가벼운 문제 목록으로 먼저 뽑고, 뽑힌 단원의 파일만 받는다.
 */

export const QUIZ_COUNTS = [5, 10, 20, 30] as const;
export const DEFAULT_QUIZ_COUNT = 5;
export const RECENT_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 난이도 이름(초급·중급·고급)은 messages 의 "levels" 에 있다 */
export interface LevelRule {
  /** 이 카드에 포함되는 문제 난이도 */
  levels: Level[];
  /** 목표 기출 비율 (1 = 기출 우선, 0.5 = 기출:예상 50:50). 기출이 모자라면 예상문제로 채운다 */
  pastRatio: number;
  /**
   * true 면 기출문제만 출제한다 (초급·중급).
   * 단, 그 자격증에 등록된 기출이 하나도 없으면 풀 수 있는 문제가 없어지므로 예상문제로 대신한다.
   */
  pastOnly: boolean;
  /**
   * true 면 선지를 줄일 수 없는 문제(levelLock)를 뺀다.
   * 초급·중급은 선지를 2개·3개만 보여 주므로(lib/choices.ts) 이런 문제를 낼 수 없다.
   */
  excludeLocked: boolean;
}

/**
 * 초급·중급(기출 전용)인데 그 자격증에 등록된 기출이 하나도 없을 때 예상문제로 대신 출제할지.
 * false 로 바꾸면 기출이 등록될 때까지 초급·중급 버튼이 비활성화된다.
 */
export const FALLBACK_TO_PREDICTED_WHEN_NO_PAST = true;

/**
 * 중요도(1~5)별 출제 가중치. 연습 풀이에서 단원 출제 비중에 곱한다.
 * 숫자가 클수록 그 중요도의 단원에서 문제가 더 많이 나온다. (실전 CBT 모의고사에는 적용하지 않는다)
 */
export const IMPORTANCE_BOOST: Record<number, number> = { 1: 0.6, 2: 0.8, 3: 1, 4: 1.2, 5: 1.4 };

/**
 * 지금은 모든 문제가 AI 예상문제다 (사용자 결정: 기출문제는 싣지 않는다).
 * pastOnly·pastRatio 는 나중에 권리가 확인된 기출을 넣게 될 때를 위해 남겨 둔 값이다.
 */
export const LEVEL_RULES: Record<QuizLevel, LevelRule> = {
  basic: {
    levels: ["basic"],
    pastRatio: 0,
    pastOnly: false,
    excludeLocked: true,
  },
  intermediate: {
    levels: ["basic", "intermediate"],
    pastRatio: 0,
    pastOnly: false,
    excludeLocked: true,
  },
  advanced: {
    levels: ["intermediate", "advanced"],
    pastRatio: 0,
    pastOnly: false,
    excludeLocked: false,
  },
};

export type Rng = () => number;

/** 풀이 기록: 문제 id → 마지막으로 푼 시각(ms) */
export type SolveHistory = Record<string, { lastSolvedAt: number } | undefined>;

/** 시드가 같으면 항상 같은 순서가 나오는 난수 (테스트용) */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 난이도 카드와 범위(전체/특정 과목)에 해당하는 문제 모음 */
export function filterPool<T extends QuestionKey>(
  questions: T[],
  level: QuizLevel,
  subjectId?: string | null,
): T[] {
  const rule = LEVEL_RULES[level];
  // 초급·중급은 기출만. 등록된 기출이 하나도 없는 자격증만 예상문제로 대신한다
  const pastOnly =
    rule.pastOnly && (!FALLBACK_TO_PREDICTED_WHEN_NO_PAST || questions.some((q) => q.source === "past"));
  return questions.filter(
    (q) =>
      rule.levels.includes(q.level) &&
      (!rule.excludeLocked || !q.levelLock) &&
      (!pastOnly || q.source === "past") &&
      (!subjectId || subjectId === "all" || q.subjectId === subjectId),
  );
}

export function countAvailable(
  questions: QuestionKey[],
  level: QuizLevel,
  subjectId?: string | null,
): number {
  return filterPool(questions, level, subjectId).length;
}

/**
 * 최대 잔여법: total 을 weights 비율로 나눠 정수로 배분한다.
 * 몫의 소수 부분이 큰 순서로 남은 자리를 1개씩 준다.
 * 소수 부분이 같으면 priority 값이 작은 쪽이 먼저 받는다.
 */
export function largestRemainder(
  weights: number[],
  total: number,
  priority: number[] = weights.map((_, i) => i),
): number[] {
  const n = weights.length;
  if (n === 0 || total <= 0) return weights.map(() => 0);
  const sum = weights.reduce((a, b) => a + b, 0);
  const quotas = weights.map((w) => (sum > 0 ? (w / sum) * total : total / n));
  const result = quotas.map((q) => Math.floor(q + 1e-9));
  let remaining = total - result.reduce((a, b) => a + b, 0);

  const order = quotas
    .map((q, i) => ({ i, rem: Math.round((q - result[i]) * 1e9) / 1e9 }))
    .sort((a, b) => b.rem - a.rem || priority[a.i] - priority[b.i]);

  for (let k = 0; remaining > 0; k = (k + 1) % n) {
    result[order[k].i] += 1;
    remaining -= 1;
  }
  return result;
}

export interface ChapterAllocation {
  subjectId: string;
  chapterId: string;
  count: number;
}

/** 중요도 높은 순(같으면 출제 비중 큰 순, 그다음 원래 순서)의 순위. 0 이 가장 우선 */
function importanceRank(chapters: Subject["chapters"]): number[] {
  const order = chapters
    .map((c, i) => ({ i, c }))
    .sort((a, b) => b.c.importance - a.c.importance || b.c.examWeight - a.c.examWeight || a.i - b.i);
  const rank = new Array<number>(chapters.length);
  order.forEach((o, r) => {
    rank[o.i] = r;
  });
  return rank;
}

/** 과목별 문항 수 (과목의 실제 시험 문항 수 비율) */
export function allocateSubjects(subjects: Subject[], count: number, rng: Rng = Math.random): number[] {
  // 소수 부분이 같은 과목끼리는 매번 같은 과목만 손해 보지 않도록 무작위로 순서를 정한다
  const tieBreak = shuffle(
    subjects.map((_, i) => i),
    rng,
  );
  const priority = new Array<number>(subjects.length);
  tieBreak.forEach((subjectIndex, r) => {
    priority[subjectIndex] = r;
  });
  return largestRemainder(
    subjects.map((s) => s.questionCount),
    count,
    priority,
  );
}

/**
 * 한 과목 안에서 단원별 문항 수.
 * importanceBoost 가 true 면 출제 비중에 중요도 가중치를 곱해 중요한 단원이 더 많이 나오게 한다.
 */
export function allocateChapters(subject: Subject, count: number, importanceBoost = false): number[] {
  const chapters = subject.chapters;
  const rank = importanceRank(chapters);
  if (count <= 0) return chapters.map(() => 0);
  if (count < chapters.length) {
    // 문항 수가 적을 때: 중요도 높은 단원부터 1문제씩
    return chapters.map((_, i) => (rank[i] < count ? 1 : 0));
  }
  return largestRemainder(
    chapters.map((c) => c.examWeight * (importanceBoost ? (IMPORTANCE_BOOST[c.importance] ?? 1) : 1)),
    count,
    rank,
  );
}

/** 요청 문항 수를 과목 → 단원 순서로 배분한다. 합계는 항상 count 와 같다 */
export function allocateQuestions(
  subjects: Subject[],
  count: number,
  rng: Rng = Math.random,
  importanceBoost = false,
): ChapterAllocation[] {
  const perSubject = allocateSubjects(subjects, count, rng);
  const result: ChapterAllocation[] = [];
  subjects.forEach((subject, si) => {
    const perChapter = allocateChapters(subject, perSubject[si], importanceBoost);
    subject.chapters.forEach((chapter, ci) => {
      result.push({ subjectId: subject.id, chapterId: chapter.id, count: perChapter[ci] });
    });
  });
  return result;
}

export interface BuildQuizParams<T extends QuestionKey> {
  /** 출제 범위에 들어가는 과목 (특정 과목만 풀 때는 그 과목 하나만 넘긴다) */
  subjects: Subject[];
  /** 뽑을 수 있는 문제 모음 (난이도·범위로 이미 걸러진 것) */
  pool: T[];
  count: number;
  /** 목표 기출 비율 0~1 */
  pastRatio?: number;
  /** 중요한 단원에 가중치를 줄지 (연습 풀이용) */
  importanceBoost?: boolean;
  history?: SolveHistory;
  now?: number;
  rng?: Rng;
}

/**
 * 문제를 뽑는다. pool 이 count 보다 적으면 있는 만큼만 돌려준다.
 * 결과는 과목 순서대로 묶여 있고(실제 시험처럼), 과목 안에서는 무작위 순서다.
 */
export function buildQuiz<T extends QuestionKey>({
  subjects,
  pool,
  count,
  pastRatio = 1,
  importanceBoost = false,
  history = {},
  now = Date.now(),
  rng = Math.random,
}: BuildQuizParams<T>): T[] {
  const target = Math.min(count, pool.length);
  if (target <= 0) return [];

  const recentCutoff = now - RECENT_DAYS * DAY_MS;
  const isRecent = (q: T) => (history[q.id]?.lastSolvedAt ?? 0) >= recentCutoff;

  const randomOrder = new Map(shuffle(pool, rng).map((q, i) => [q.id, i]));
  const chapterImportance = new Map<string, number>();
  for (const s of subjects) for (const c of s.chapters) chapterImportance.set(c.id, c.importance);

  const picked: T[] = [];
  const pickedIds = new Set<string>();
  let pastCount = 0;

  /** candidates 에서 n 문제를 고르고, 실제로 고른 개수를 돌려준다 */
  const pickFrom = (candidates: T[], n: number, preferImportant = false): number => {
    let got = 0;
    while (got < n) {
      // 지금까지 뽑은 것 중 기출 비율이 목표보다 낮으면 기출을, 아니면 예상문제를 먼저 찾는다
      const wantPast = pastCount < pastRatio * (picked.length + 1) - 1e-9;
      let best: T | null = null;
      let bestKey: number[] | null = null;
      for (const q of candidates) {
        if (pickedIds.has(q.id)) continue;
        const key = [
          (q.source === "past") === wantPast ? 0 : 1,
          isRecent(q) ? 1 : 0,
          preferImportant ? -(chapterImportance.get(q.chapterId) ?? 0) : 0,
          randomOrder.get(q.id) ?? 0,
        ];
        if (bestKey === null || compareKeys(key, bestKey) < 0) {
          best = q;
          bestKey = key;
        }
      }
      if (!best) break;
      picked.push(best);
      pickedIds.add(best.id);
      if (best.source === "past") pastCount += 1;
      got += 1;
    }
    return got;
  };

  // 1) 단원별 배정대로 뽑기
  const allocation = allocateQuestions(subjects, target, rng, importanceBoost);
  const shortage = new Map<string, number>();
  for (const a of allocation) {
    if (a.count === 0) continue;
    const candidates = pool.filter((q) => q.chapterId === a.chapterId && q.subjectId === a.subjectId);
    const got = pickFrom(candidates, a.count);
    if (got < a.count) shortage.set(a.subjectId, (shortage.get(a.subjectId) ?? 0) + a.count - got);
  }

  // 2) 모자란 만큼 같은 과목의 다른 단원에서 채우기 (중요도 높은 단원 우선)
  let leftover = 0;
  for (const [subjectId, need] of shortage) {
    const candidates = pool.filter((q) => q.subjectId === subjectId);
    leftover += need - pickFrom(candidates, need, true);
  }

  // 3) 그래도 모자라면 범위 안의 다른 과목에서 채우기
  if (leftover > 0) pickFrom(pool, leftover, true);

  const subjectOrder = new Map(subjects.map((s, i) => [s.id, i]));
  return picked.sort(
    (a, b) =>
      (subjectOrder.get(a.subjectId) ?? 99) - (subjectOrder.get(b.subjectId) ?? 99) ||
      (randomOrder.get(a.id) ?? 0) - (randomOrder.get(b.id) ?? 0),
  );
}

function compareKeys(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

export interface LevelQuizParams<T extends QuestionKey> {
  subjects: Subject[];
  questions: T[];
  level: QuizLevel;
  count: number;
  /** "all" 또는 과목 id */
  subjectId?: string | null;
  history?: SolveHistory;
  now?: number;
  rng?: Rng;
}

/** 난이도 카드(초급/중급/고급) 기준으로 문제를 뽑는다 */
export function buildLevelQuiz<T extends QuestionKey>({
  subjects,
  questions,
  level,
  count,
  subjectId,
  history,
  now,
  rng,
}: LevelQuizParams<T>): T[] {
  const scoped =
    subjectId && subjectId !== "all" ? subjects.filter((s) => s.id === subjectId) : subjects;
  return buildQuiz({
    subjects: scoped,
    pool: filterPool(questions, level, subjectId),
    count,
    pastRatio: LEVEL_RULES[level].pastRatio,
    importanceBoost: true,
    history,
    now,
    rng,
  });
}

/**
 * 실전 CBT 를 실제 시험과 같은 문항 수로 내려면 과목마다 questionCount 만큼의 문제가 있어야 한다.
 * 과목별로 모자란 문제 수를 돌려준다 (모자란 과목이 없으면 빈 배열 = 실전 CBT 를 낼 수 있다).
 */
export function mockExamShortage(
  subjects: Subject[],
  questions: QuestionKey[],
): Array<{ subjectId: string; have: number; need: number }> {
  return subjects
    .map((s) => ({
      subjectId: s.id,
      have: questions.filter((q) => q.subjectId === s.id).length,
      need: s.questionCount,
    }))
    .filter((s) => s.have < s.need);
}

/**
 * 실전 CBT 모의고사: 실제 시험과 같은 전체 문항 수·과목별 문항 수로 뽑는다.
 * 문제가 모자란 자격증은 화면에서 시작할 수 없게 막는다 (mockExamShortage).
 */
export function buildMockExam<T extends QuestionKey>(params: {
  subjects: Subject[];
  questions: T[];
  totalQuestions: number;
  history?: SolveHistory;
  now?: number;
  rng?: Rng;
}): T[] {
  return buildQuiz({
    subjects: params.subjects,
    pool: params.questions,
    count: params.totalQuestions,
    pastRatio: 1,
    history: params.history,
    now: params.now,
    rng: params.rng,
  });
}

/** 실전 CBT 제한 시간(초): 실제 시험의 제한 시간 그대로 */
export function mockExamSeconds(examInfo: { timeLimitMinutes: number }): number {
  return examInfo.timeLimitMinutes * 60;
}
