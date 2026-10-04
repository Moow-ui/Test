/** P14: 개념 정리 (concepts.json) — 검증을 통과한 단원만 페이지·sitemap 에 나온다 */
import { describe, expect, it } from "vitest";
import { getConcepts, getReadyCertifications } from "@/lib/data";
import { conceptsFileSchema } from "@/lib/schemas";
import { sitemapEntries } from "@/lib/sitemap";
import { conceptChapterParams, conceptParams } from "@/lib/static-params";

const card = (n: number) => ({
  term: `용어${n}`,
  definition: "열 글자가 넘는 정의 문장입니다.",
  tip: "외우는 요령",
});

describe("concepts.json 스키마", () => {
  it("핵심 개념은 3~7개", () => {
    const base = { by: "ai", chapters: { a: { concepts: [card(1), card(2)], points: ["포인트 하나", "포인트 둘"] } } };
    expect(conceptsFileSchema.safeParse(base).success).toBe(false);
    base.chapters.a.concepts.push(card(3));
    expect(conceptsFileSchema.safeParse(base).success).toBe(true);
  });

  it("비교표는 줄마다 칸 수가 같아야 한다", () => {
    const file = {
      by: "ai",
      chapters: {
        a: {
          concepts: [card(1), card(2), card(3)],
          points: ["포인트 하나", "포인트 둘"],
          compare: { title: "비교", columns: ["구분", "A", "B"], rows: [["뜻", "가"], ["예", "나", "다"]] },
        },
      },
    };
    expect(conceptsFileSchema.safeParse(file).success).toBe(false);
  });
});

describe("검증을 통과한 단원만 게시", () => {
  it("getConcepts 는 verifiedAt 이 있는 단원만, 단원 순서대로 돌려준다", async () => {
    for (const cert of await getReadyCertifications()) {
      const concepts = await getConcepts(cert.id);
      if (!concepts) continue;
      const order = cert.subjects.flatMap((s) => s.chapters.map((c) => c.id));
      const ids = concepts.chapters.map((c) => c.id);
      expect(ids.every((id) => order.includes(id))).toBe(true);
      expect([...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(ids);
      for (const c of concepts.chapters) expect(c.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("정적 주소·sitemap 은 getConcepts 결과와 같다", async () => {
    const certParams = await conceptParams();
    const chapterParams = await conceptChapterParams();
    const ko = (await sitemapEntries("ko")).map((e) => e.path);
    for (const cert of await getReadyCertifications("KR")) {
      const concepts = await getConcepts(cert.id);
      const base = `/ko/cert/${cert.id}/concepts`;
      expect(ko.includes(base)).toBe(!!concepts);
      expect(certParams.some((p) => p.lang === "ko" && p.slug === cert.id)).toBe(!!concepts);
      for (const subject of cert.subjects) {
        for (const chapter of subject.chapters) {
          const published = !!concepts?.chapters.some((c) => c.id === chapter.id);
          expect(ko.includes(`${base}/${chapter.id}`)).toBe(published);
          expect(chapterParams.some((p) => p.slug === cert.id && p.chapterId === chapter.id)).toBe(published);
        }
      }
    }
  });
});
