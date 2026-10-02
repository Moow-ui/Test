import { describe, expect, it } from "vitest";
import { detectLevelLock, rankDistractors, reduceChoices } from "@/lib/choice-reduce";
import { levelChoiceCount, visibleChoices } from "@/lib/choices";
import { checkChoicesByLevel, questionSchema } from "@/lib/schemas";
import { makeQuestion } from "./helpers";

/** 난이도별 선지 수: 초급 2개, 중급 3개, 고급 4개, 실전 문제풀이 는 시험의 실제 선지 수 */

describe("visibleChoices (화면에 보여 줄 선지)", () => {
  const q = makeQuestion("a", "a1", { answer: 3, choicesByLevel: { basic: [3, 4], intermediate: [1, 3, 4] } });

  it("초급 2개, 중급 3개, 고급 4개를 데이터에 적힌 대로 보여 준다", () => {
    expect(visibleChoices(q, "basic")).toEqual([3, 4]);
    expect(visibleChoices(q, "intermediate")).toEqual([1, 3, 4]);
    expect(visibleChoices(q, "advanced")).toEqual([1, 2, 3, 4]);
  });

  it("난이도가 없으면(실전 문제풀이·단원 풀기·오답노트) 모두 보여 준다", () => {
    expect(visibleChoices(q, null)).toEqual([1, 2, 3, 4]);
    expect(visibleChoices(q, undefined)).toEqual([1, 2, 3, 4]);
  });

  it("levelLock 문제는 언제나 모두 보여 준다", () => {
    const locked = makeQuestion("a", "a1", { levelLock: true, choicesByLevel: undefined });
    expect(visibleChoices(locked, "basic")).toEqual([1, 2, 3, 4]);
  });

  it("5지선다 시험이면 고급도 4개로 줄인다", () => {
    const five = makeQuestion("a", "a1", {
      choices: ["가", "나", "다", "라", "마"],
      answer: 5,
      choicesByLevel: { basic: [2, 5], intermediate: [2, 4, 5], advanced: [1, 2, 4, 5] },
    });
    expect(visibleChoices(five, "advanced")).toEqual([1, 2, 4, 5]);
    expect(visibleChoices(five, null)).toEqual([1, 2, 3, 4, 5]);
  });

  it("난이도 카드에 적는 선지 수는 시험의 선지 수를 넘지 않는다", () => {
    expect([levelChoiceCount("basic", 4), levelChoiceCount("intermediate", 4), levelChoiceCount("advanced", 4)]).toEqual([2, 3, 4]);
    expect(levelChoiceCount("advanced", 5)).toBe(4);
    expect(levelChoiceCount("advanced", 3)).toBe(3);
  });
});

describe("checkChoicesByLevel (데이터 검사)", () => {
  const base = { choices: ["가", "나", "다", "라"], answer: 2, levelLock: false };

  it("올바른 값은 통과한다", () => {
    expect(checkChoicesByLevel({ ...base, choicesByLevel: { basic: [2, 4], intermediate: [1, 2, 4] } })).toEqual([]);
    expect(checkChoicesByLevel({ ...base, levelLock: true })).toEqual([]);
  });

  it("값이 없거나, 개수가 다르거나, 정답이 빠지면 오류", () => {
    expect(checkChoicesByLevel(base)).toHaveLength(2);
    expect(checkChoicesByLevel({ ...base, choicesByLevel: { basic: [2, 3, 4], intermediate: [1, 2, 4] } })).not.toEqual([]);
    expect(checkChoicesByLevel({ ...base, choicesByLevel: { basic: [1, 4], intermediate: [1, 2, 4] } })).not.toEqual([]);
    expect(checkChoicesByLevel({ ...base, choicesByLevel: { basic: [2, 5], intermediate: [1, 2, 4] } })).not.toEqual([]);
  });

  it("초급의 선지는 중급의 선지 안에서 골라야 한다", () => {
    expect(checkChoicesByLevel({ ...base, choicesByLevel: { basic: [2, 3], intermediate: [1, 2, 4] } })).not.toEqual([]);
  });

  it("levelLock 문제나 선지를 모두 보여 주는 난이도에는 적지 않는다", () => {
    expect(checkChoicesByLevel({ ...base, levelLock: true, choicesByLevel: { basic: [2, 4] } })).not.toEqual([]);
    expect(
      checkChoicesByLevel({ ...base, choicesByLevel: { basic: [2, 4], intermediate: [1, 2, 4], advanced: [1, 2, 3, 4] } }),
    ).not.toEqual([]);
  });

  it("문제 스키마가 이 검사를 함께 한다", () => {
    const q = makeQuestion("a", "a1");
    expect(questionSchema.safeParse(q).success).toBe(true);
    expect(questionSchema.safeParse({ ...q, choicesByLevel: undefined }).success).toBe(false);
    expect(questionSchema.safeParse({ ...q, choicesByLevel: undefined, levelLock: true }).success).toBe(true);
  });

  it("검수 완료(verified)와 검증 날짜(reviewedAt)는 함께 있어야 한다", () => {
    const q = makeQuestion("a", "a1");
    expect(questionSchema.safeParse({ ...q, reviewStatus: "verified" }).success).toBe(false);
    expect(questionSchema.safeParse({ ...q, reviewedAt: "2026-10-02" }).success).toBe(false);
    expect(questionSchema.safeParse({ ...q, reviewStatus: "verified", reviewedAt: "2026-10-02" }).success).toBe(true);
    expect(questionSchema.safeParse({ ...q, reviewStatus: "verified", reviewedAt: "10/02" }).success).toBe(false);
  });
});

describe("변환 규칙 (lib/choice-reduce.ts)", () => {
  const choices = ["가", "나", "다", "라"];

  it("부정형·모두 고르기·다른 선지를 가리키는 선지는 줄일 수 없다", () => {
    for (const stem of [
      "전선 접속에 대한 설명으로 옳지 않은 것은?",
      "재해 예방의 4원칙에 해당하지 않는 것은?",
      "동기발전기를 병렬로 운전하기 위한 조건이 아닌 것은?",
      "가공전선로의 지선에 대한 설명으로 틀린 것은?",
      "다음 중 추세선을 추가할 수 없는 차트는?",
      "다음 중 옳은 것을 모두 고르시오.",
      "다음 설명 가운데 옳은 것은 몇 개인가?",
      "Which of the following is NOT a requirement?",
    ]) {
      expect(detectLevelLock({ stem, choices }), stem).not.toBeNull();
    }
    expect(detectLevelLock({ stem: "옳은 것은?", choices: ["가", "나", "다", "①과 ② 모두"] })).not.toBeNull();
    expect(detectLevelLock({ stem: "옳은 것은?", choices: ["ㄱ, ㄴ", "ㄱ, ㄷ", "ㄴ, ㄷ", "ㄱ, ㄴ, ㄷ"] })).not.toBeNull();
  });

  it("문장 중간에 '않은'·'없는'이 있어도 부정형이 아니면 줄일 수 있다", () => {
    for (const stem of [
      "저항 20Ω에 100V의 전압을 가했을 때 흐르는 전류는 몇 A인가?",
      "하향식 통합 테스트에서, 아직 만들어지지 않은 하위 모듈을 대신하는 임시 모듈은?",
      "사용자가 값을 고칠 수 없는 데이터 형식은?",
      "비상 콘센트의 수는 몇 개 이하로 해야 하는가?",
      "직류 직권전동기를 벨트로 부하에 연결해 운전하면 안 되는 이유로 가장 알맞은 것은?",
    ]) {
      expect(detectLevelLock({ stem, choices }), stem).toBeNull();
    }
  });

  const ohm = {
    stem: "저항 20Ω에 100V의 전압을 가했을 때 흐르는 전류는 몇 A인가?",
    choices: ["0.2A", "2A", "5A", "2000A"],
    answer: 3,
    explanation: "**틀린 선지**\n- ① 0.2A: 나누는 순서가 거꾸로 되었습니다.\n- ② 2A: 계산 실수.\n- ④ 2000A: 곱한 값입니다.",
  };

  it("오답을 그럴듯한 순서로 줄 세우고, 정답 + 앞쪽 오답만 남긴다", () => {
    expect(rankDistractors(ohm)[0]).toBe(1);
    const { choicesByLevel } = reduceChoices(ohm);
    expect(choicesByLevel?.basic).toEqual([1, 3]);
    expect(choicesByLevel?.intermediate).toHaveLength(3);
    expect(choicesByLevel?.advanced).toBeUndefined();
    expect(checkChoicesByLevel({ ...ohm, levelLock: false, choicesByLevel })).toEqual([]);
  });

  it("사람이 정한 오답 순서가 자동 판단보다 앞선다", () => {
    expect(reduceChoices(ohm, [4, 2]).choicesByLevel).toEqual({ basic: [3, 4], intermediate: [2, 3, 4] });
    expect(reduceChoices(ohm, [], true)).toEqual({ levelLock: true });
  });

  it("5지선다는 고급(4개)에서도 줄인다", () => {
    const five = { ...ohm, choices: [...ohm.choices, "50A"] };
    const { choicesByLevel } = reduceChoices(five, [1, 2, 5]);
    expect(choicesByLevel).toEqual({ basic: [1, 3], intermediate: [1, 2, 3], advanced: [1, 2, 3, 5] });
  });
});
