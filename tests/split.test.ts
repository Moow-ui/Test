import { describe, expect, it } from "vitest";
import { getSplitInProgress } from "@/lib/data";
import { certQueueSchema } from "@/lib/schemas";

const item = {
  slug: "heavy-cert",
  country: "KR",
  name: "무거운 자격증",
  issuer: "시행기관",
  certType: "national-professional",
  field: "부동산",
  pastQuestions: "public",
  usageNote: "공공누리 제1유형",
};

describe("이틀에 나눠 진행 (cert-queue.json 의 split)", () => {
  it("split 은 시작 날짜와 맡은 루틴(am·pm)만 받는다", () => {
    expect(certQueueSchema.safeParse([{ ...item, split: { startedAt: "2026-10-14", routine: "am" } }]).success).toBe(true);
    expect(certQueueSchema.safeParse([{ ...item, split: { startedAt: "10/14", routine: "am" } }]).success).toBe(false);
    expect(certQueueSchema.safeParse([{ ...item, split: { startedAt: "2026-10-14", routine: "night" } }]).success).toBe(false);
  });

  it("기록 페이지용 목록은 split 이 적힌 그 나라 후보만 돌려준다", async () => {
    const queue = certQueueSchema.parse((await import("@/data/cert-queue.json")).default);
    for (const country of ["KR", "US"] as const) {
      const expected = queue.filter((q) => q.country === country && q.split).map((q) => q.name).sort();
      expect((await getSplitInProgress(country)).map((s) => s.name).sort()).toEqual(expected);
    }
  });
});
