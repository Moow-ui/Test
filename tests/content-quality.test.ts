import { describe, expect, it } from "vitest";
import {
  type CertText,
  certSentenceKeys,
  checkCertContent,
  mustPassContentCheck,
  normalizeSentence,
  sentenceSimilarity,
} from "@/lib/content-quality";

/** 서로 다른 문장 n개 (숫자는 비교 때 지워지므로 글자로 구분한다) */
const WORDS = "가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허";
const long = (s: string, n: number) =>
  Array.from({ length: n }, (_, i) => `${s} 단원의 ${WORDS[i % WORDS.length]}${WORDS[(i * 7) % WORDS.length]} 항목은 시험에 자주 나오는 내용을 다룹니다.`).join(" ");

function cert(id: string, chapters: CertText["chapters"], names = [id]): CertText {
  return { id, country: "KR", names, chapters };
}

describe("고유 내용 검사", () => {
  it("자격증 이름만 바꾼 문장은 같은 문장으로 본다", () => {
    expect(normalizeSentence("지게차운전기능사 시험은 60문항이다.", ["지게차운전기능사"])).toBe(
      normalizeSentence("굴착기운전기능사 시험은 60문항이다.", ["굴착기운전기능사"]),
    );
  });

  it("요점과 개념 정리가 같은 문장이면 잡는다", () => {
    expect(sentenceSimilarity("점멸 빨간불은 일시정지 표지와 같다.", "점멸 빨간불은 일시정지 표지와 같다")).toBe(1);
    const c = cert("a", [
      { id: "ch", summary: long("소개", 20), keyPoints: ["점멸 빨간불은 일시정지 표지와 같은 뜻입니다."], conceptText: ["점멸 빨간불은 일시정지 표지와 같은 뜻입니다."] },
    ]);
    expect(checkCertContent(c, new Map()).internal).toBe(1);
  });

  it("글이 짧은 단원과 함정이 없는 자격증을 잡는다", () => {
    const r = checkCertContent(cert("a", [{ id: "ch", summary: "짧다.", keyPoints: [] }]), new Map());
    expect(r.thin).toBe(1);
    expect(r.problems.some((p) => p.includes("함정"))).toBe(true);
  });

  it("기준을 채우면 문제가 없다", () => {
    const pitfalls = [
      { trap: "점멸 노란불에서는 반드시 멈춘다", fact: "점멸 노란불은 주의하면서 지나가라는 뜻이다. 멈추라는 뜻은 점멸 빨간불이다." },
      { trap: "흰색 실선은 넘어가도 된다", fact: "흰색 실선은 같은 방향 차로를 나누며 차로를 바꾸지 말라는 뜻이다." },
    ];
    const c = cert("a", [{ id: "ch", summary: long("소개", 15), keyPoints: ["요점 하나입니다."], pitfalls }]);
    const other = cert("b", [{ id: "ch", summary: long("다른", 15), keyPoints: [] }]);
    const r = checkCertContent(c, new Map([["b", certSentenceKeys(other)]]));
    expect(r.problems).toEqual([]);
  });

  it("다른 자격증과 같은 문장이 많으면 잡는다", () => {
    const shared = long("공통", 20);
    const a = cert("a", [{ id: "ch", summary: shared, keyPoints: [] }]);
    const b = cert("b", [{ id: "ch", summary: shared, keyPoints: [] }]);
    const r = checkCertContent(a, new Map([["b", certSentenceKeys(b)]]));
    expect(r.shared).toBeGreaterThan(0);
    expect(r.problems.some((p) => p.includes("똑같은 문장"))).toBe(true);
  });

  it("다듬은 자격증과 2026-11-04 이후 새 자격증만 오류로 검사한다", () => {
    expect(mustPassContentCheck({ addedAt: "2026-10-20" })).toBe(false);
    expect(mustPassContentCheck({ addedAt: "2026-10-20", refinedAt: "2026-11-04" })).toBe(true);
    expect(mustPassContentCheck({ addedAt: "2026-11-04" })).toBe(true);
  });
});
