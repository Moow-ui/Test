/** 합격 가이드: 스키마·최소 분량 검사 */
import { describe, expect, it } from "vitest";
import { readingMinutes } from "@/lib/format";
import { GUIDE_MAX_SIMILARITY, guideSimilarity, isGuideExpired } from "@/lib/guide-quality";
import { guideSchema } from "@/lib/schemas";

const body = "가".repeat(300);
const base = {
  slug: "sample-guide",
  title: "샘플 가이드 제목입니다",
  description: "샘플 가이드 설명입니다. 검색 결과에 보이는 문장.",
  category: "pass-guide",
  publishedAt: "2026-10-18",
  basisDate: "2026-10-18",
  intro: body,
  sections: [
    { heading: "첫째 소제목", body },
    { heading: "둘째 소제목", body },
    { heading: "셋째 소제목", body },
  ],
  sources: [{ title: "큐넷", url: "https://www.q-net.or.kr", checkedAt: "2026-10-18" }],
};

describe("합격 가이드 스키마", () => {
  it("기본 글은 통과하고 by 는 ai 가 기본값", () => {
    const g = guideSchema.parse(base);
    expect(g.by).toBe("ai");
    expect(g.certIds).toEqual([]);
  });

  it("출처가 없거나 소제목이 3개 미만이면 막는다", () => {
    expect(guideSchema.safeParse({ ...base, sources: [] }).success).toBe(false);
    expect(guideSchema.safeParse({ ...base, sections: base.sections.slice(0, 2) }).success).toBe(false);
  });

  it("slug 는 영문 소문자·숫자·하이픈만", () => {
    expect(guideSchema.safeParse({ ...base, slug: "지게차" }).success).toBe(false);
    expect(guideSchema.safeParse({ ...base, slug: "Bad_Slug" }).success).toBe(false);
  });
});

describe("수험 정보 읽는 시간", () => {
  it("한국어는 띄어쓰기 뺀 500자당 1분(올림), 최소 1분", () => {
    expect(readingMinutes(["가".repeat(1001)], "ko")).toBe(3);
    expect(readingMinutes(["짧은 글"], "ko")).toBe(1);
  });
  it("영어는 220단어당 1분", () => {
    expect(readingMinutes([Array(440).fill("word").join(" ")], "en")).toBe(2);
  });
});

describe("수험 정보 품질 보호", () => {
  it("자격증 이름만 바꾼 글은 유사도가 기준을 넘는다", () => {
    const a = { ...base, intro: "지게차 필기는 장비 구조부터 공부하고 법규 숫자는 마지막에 몰아서 본다. " + body };
    const b = { ...a, intro: a.intro.replaceAll("지게차", "굴착기") };
    expect(guideSimilarity(a, b)).toBeGreaterThanOrEqual(GUIDE_MAX_SIMILARITY);
  });
  it("내용이 다른 글은 기준 아래", () => {
    const a = { title: "가", intro: "유압 펌프는 기름을 보내고 밸브는 방향과 압력을 조절한다.", sections: [] };
    const b = { title: "나", intro: "원서 접수는 큐넷에서 하고 신분증을 꼭 챙긴다. 시험장에는 일찍 간다.", sections: [] };
    expect(guideSimilarity(a, b)).toBeLessThan(GUIDE_MAX_SIMILARITY);
  });
  it("validUntil 이 지나면 지난 글", () => {
    expect(isGuideExpired({ validUntil: "2026-10-10" }, "2026-10-18")).toBe(true);
    expect(isGuideExpired({ validUntil: "2026-10-18" }, "2026-10-18")).toBe(false);
    expect(isGuideExpired({}, "2030-01-01")).toBe(false);
  });
  it("일정 글은 스키마상 validUntil 을 받을 수 있다", () => {
    expect(guideSchema.safeParse({ ...base, category: "schedule", validUntil: "2026-11-30" }).success).toBe(true);
  });
});
