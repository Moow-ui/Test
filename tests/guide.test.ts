/** 합격 가이드: 스키마·최소 분량 검사 */
import { describe, expect, it } from "vitest";
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
