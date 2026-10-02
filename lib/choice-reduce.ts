import { LEVELS, LEVEL_CHOICE_COUNT } from "./schemas";
import type { Level, Question } from "./types";

/**
 * 문제를 "난이도별 선지 수" 구조로 바꾸는 규칙 (스크립트 전용. 화면은 lib/choices.ts 만 쓴다).
 *   scripts/convert-choices.ts   기존 문제 전체 변환
 *   scripts/import-questions.ts  새 문제를 넣을 때 비어 있으면 자동으로 채움
 *
 * 1) 선지를 줄이면 뜻이 깨지는 문제는 levelLock (초급·중급에서 제외)
 * 2) 그 밖의 문제는 오답을 "그럴듯한 순서"로 줄 세워, 정답 + 앞쪽 오답만 남긴다 (choicesByLevel)
 *
 * 자동 판단은 어림이다. 사람이 정한 순서가 있으면 그것을 쓴다 (order 인자).
 */

type Source = Pick<Question, "stem" | "choices" | "answer" | "explanation">;

/** 문제(stem)가 이 모양이면 선지를 줄일 수 없다: 부정형, 모두 고르기, 개수 세기 */
const LOCK_STEM_PATTERNS: Array<[RegExp, string]> = [
  [/(옳|맞|알맞|바르|적절하|적합하|해당하|속하|포함되)지 (않|못)/, "부정형 (옳지 않은 것은?)"],
  // 문장 끝의 "…이 아닌 것은?", "…할 수 없는 차트는?" (중간에 나오는 "않은"·"없는"은 부정형이 아니다)
  [
    /(않은|않는|아닌|틀린|잘못된|없는|못한|거리가 먼|부적절한|어긋나는)\s+(\S+\s+)?(것|사람|차트|방법|항목|경우|설명|내용|조건|종류|사항)[은는]\??\s*(\([^)]*\))?\s*$/,
    "부정형 (…이 아닌 것은?)",
  ],
  [/모두 고[르른]|모두 나열|모두 묶|있는 대로/, "모두 고르기"],
  [/(것|설명|항목|보기)[은는이]?\s*(모두\s*)?몇\s*(개|가지)/, "개수 세기"],
  // 수식 속의 FALSE(예: VLOOKUP 의 인수)는 부정형이 아니므로 "is FALSE" 꼴만 본다
  [/\b(NOT|EXCEPT|LEAST|INCORRECT)\b|\bis FALSE\b/, "부정형 (NOT / EXCEPT)"],
  [/select all|choose all|all that apply|how many of the (following|statements)/i, "모두 고르기"],
];

/** 선지가 이 모양이면 다른 선지를 가리키므로 줄일 수 없다 */
const LOCK_CHOICE_PATTERNS: Array<[RegExp, string]> = [
  [/[①②③④⑤⑥]/, "다른 선지를 가리키는 선지"],
  [/^[ㄱ-ㅎ가-라a-e](\s*[,·、]\s*[ㄱ-ㅎ가-라a-e])+$/, "보기 조합형 (ㄱ, ㄴ)"],
  [/위의? (보기|항목|것)|모두 (맞|옳|해당)|보기 모두|정답 없음|해당 없음/, "다른 선지를 가리키는 선지"],
  [/(all|none|both) of the above|both [a-e] and [a-e]/i, "다른 선지를 가리키는 선지"],
];

/** 선지를 줄일 수 없는 문제면 그 이유를, 줄일 수 있으면 null 을 돌려준다 */
export function detectLevelLock(question: Pick<Question, "stem" | "choices">): string | null {
  for (const [pattern, reason] of LOCK_STEM_PATTERNS) {
    if (pattern.test(question.stem)) return reason;
  }
  for (const choice of question.choices) {
    for (const [pattern, reason] of LOCK_CHOICE_PATTERNS) {
      if (pattern.test(choice.trim())) return reason;
    }
  }
  return null;
}

function bigrams(text: string): Set<string> {
  const t = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}

/** 두 글이 얼마나 비슷한가 0~1 (같은 낱말을 많이 쓸수록 헷갈리기 쉽다) */
function similarity(a: string, b: string): number {
  const x = bigrams(a);
  const y = bigrams(b);
  if (x.size === 0 || y.size === 0) return 0;
  let shared = 0;
  for (const g of x) if (y.has(g)) shared += 1;
  return shared / (x.size + y.size - shared);
}

function numbers(text: string): number[] {
  return (text.replace(/,/g, "").match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** 숫자 선지끼리 값이 가까운 정도 0~1 (숫자가 없거나 개수가 다르면 0) */
function numericCloseness(a: string, b: string): number {
  const x = numbers(a);
  const y = numbers(b);
  if (x.length === 0 || x.length !== y.length) return 0;
  const distance =
    x.reduce((sum, v, i) => sum + (v > 0 && y[i] > 0 ? Math.abs(Math.log(y[i] / v)) : Math.abs(y[i] - v)), 0) /
    x.length;
  return 1 / (1 + distance);
}

const CIRCLED = "①②③④⑤⑥";

/** 해설의 "틀린 선지" 목록에서 n번 선지를 설명한 줄 */
function wrongReason(explanation: string, n: number): string {
  const mark = CIRCLED[n - 1];
  return explanation.split("\n").find((line) => /^\s*[-*]/.test(line) && line.includes(mark)) ?? "";
}

/**
 * 오답 선지 번호를 그럴듯한 순서로 줄 세운다 (앞이 가장 그럴듯한 오답).
 *  - 정답과 낱말이 많이 겹치는 선지, 값이 가까운 숫자
 *  - 해설이 "착각·혼동하기 쉽다"고 설명한 선지는 앞으로, "관계없다"고 한 선지는 뒤로
 */
export function rankDistractors(question: Source): number[] {
  const answerText = question.choices[question.answer - 1] ?? "";
  return question.choices
    .map((text, i) => ({ n: i + 1, text }))
    .filter((c) => c.n !== question.answer)
    .map((c) => {
      const reason = wrongReason(question.explanation, c.n);
      let score = 2 * similarity(answerText, c.text) + numericCloseness(answerText, c.text);
      if (/착각|혼동|헷갈|거꾸로|반대|바꿔|바뀌|뒤바|비슷|흔히|자주|confus|mistak|revers|opposite/i.test(reason)) score += 1;
      if (/관계없|관계가 없|관련이 없|관련 없|전혀|unrelated/i.test(reason)) score -= 1;
      return { n: c.n, score };
    })
    .sort((a, b) => b.score - a.score || a.n - b.n)
    .map((c) => c.n);
}

export interface ReducedChoices {
  levelLock?: true;
  choicesByLevel?: Partial<Record<Level, number[]>>;
}

/**
 * 문제 한 건의 levelLock·choicesByLevel 값을 만든다.
 * order 는 사람이 정한 "그럴듯한 오답 순서"(선지 번호). 빠진 오답은 자동 순서로 뒤에 붙인다.
 * lock 은 사람이 정한 잠금 여부 (없으면 자동 판단).
 */
export function reduceChoices(question: Source, order: number[] = [], lock?: boolean): ReducedChoices {
  if (lock ?? detectLevelLock(question) !== null) return { levelLock: true };
  const auto = rankDistractors(question);
  const picked = order.filter((n) => auto.includes(n));
  const ranked = [...new Set([...picked, ...auto])];

  const choicesByLevel: Partial<Record<Level, number[]>> = {};
  for (const level of LEVELS) {
    const want = LEVEL_CHOICE_COUNT[level];
    if (want >= question.choices.length) continue;
    choicesByLevel[level] = [question.answer, ...ranked.slice(0, want - 1)].sort((a, b) => a - b);
  }
  return Object.keys(choicesByLevel).length > 0 ? { choicesByLevel } : {};
}
