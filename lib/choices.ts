import { LEVEL_CHOICE_COUNT } from "./schemas";
import type { Question, QuizLevel } from "./types";

/**
 * 난이도별 선지 수: 초급 2개, 중급 3개, 고급 4개, 실전 문제풀이 는 시험의 실제 선지 수.
 *
 * 선지를 줄일 때는 "정답 + 가장 그럴듯한 오답"을 남긴다. 무엇을 남길지는 문제 데이터에
 * 미리 적혀 있다 (choicesByLevel). 화면에서 무작위로 빼지 않는다.
 * 답은 언제나 원래 선지 번호로 저장한다 (오답노트·풀이 기록이 원래 번호를 가리킨다).
 */

type ChoiceFields = Pick<Question, "choices" | "choicesByLevel" | "levelLock">;

/**
 * 이 난이도에서 보여 줄 선지의 원래 번호 (1부터, 원래 순서).
 * level 이 null 이면(실전 문제풀이, 단원 풀기, 오답노트 등) 선지를 모두 보여 준다.
 */
export function visibleChoices(question: ChoiceFields, level: QuizLevel | null | undefined): number[] {
  const all = question.choices.map((_, i) => i + 1);
  if (!level || question.levelLock) return all;
  return question.choicesByLevel?.[level] ?? all;
}

/** 난이도 카드에 적는 선지 수 (시험의 선지 수가 더 적으면 그 수) */
export function levelChoiceCount(level: QuizLevel, examChoiceCount: number): number {
  return Math.min(LEVEL_CHOICE_COUNT[level], examChoiceCount);
}
