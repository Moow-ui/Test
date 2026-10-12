import { describe, expect, it } from "vitest";
import { questionSchema } from "@/lib/schemas";
import { MAX_SVG_BYTES, checkSvg, svgDataUri } from "@/lib/svg";

const OK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect x="1" y="1" width="98" height="48" fill="none" stroke="#000"/><text x="50" y="30">R</text></svg>`;

describe("checkSvg — 문제·개념 그림 검사", () => {
  it("선·도형·글자로 그린 SVG 는 통과", () => {
    expect(checkSvg(OK)).toEqual([]);
  });

  it("viewBox 가 없으면 막는다 (화면 폭에 맞춰 줄어들지 않는다)", () => {
    expect(checkSvg(`<svg width="100" height="50"></svg>`).join()).toContain("viewBox");
  });

  it("스크립트·이벤트 속성·외부 주소·사진을 막는다", () => {
    const bad = [
      `<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>`,
      `<svg viewBox="0 0 1 1" onload="alert(1)"></svg>`,
      `<svg viewBox="0 0 1 1"><a href="https://example.com"><rect/></a></svg>`,
      `<svg viewBox="0 0 1 1"><image href="x.png"/></svg>`,
      `<svg viewBox="0 0 1 1"><foreignObject/></svg>`,
      `<svg viewBox="0 0 1 1"><style>@import url(https://x/y.css);</style></svg>`,
    ];
    for (const svg of bad) expect(checkSvg(svg).length).toBeGreaterThan(0);
  });

  it("너무 큰 그림은 막는다", () => {
    const big = OK.replace("</svg>", `<!--${"x".repeat(MAX_SVG_BYTES)}--></svg>`);
    expect(checkSvg(big).join()).toContain("너무 큽니다");
  });
});

describe("svgDataUri", () => {
  it("<img src> 에 넣을 수 있는 data: 주소를 만든다", () => {
    const uri = svgDataUri(`<svg viewBox="0 0 1 1">\n  <path fill="#fff" d="M0 0"/>\n</svg>`);
    expect(uri.startsWith("data:image/svg+xml,")).toBe(true);
    expect(uri).not.toMatch(/[<>#"\n]/);
    expect(decodeURIComponent(uri.slice("data:image/svg+xml,".length))).toBe(
      `<svg viewBox='0 0 1 1'> <path fill='#fff' d='M0 0'/> </svg>`,
    );
  });
});

describe("문제 그림 필드", () => {
  const base = {
    id: "demo-ch-0001",
    certId: "demo",
    subjectId: "s",
    chapterId: "ch",
    source: "predicted",
    level: "basic",
    stem: "그림의 표지판이 뜻하는 것은?",
    choices: ["정지", "서행"],
    answer: 1,
    oneLineConcept: "정지 표지",
    explanation: "설명",
    frequency: 3,
    reviewStatus: "unverified",
  };

  it("그림이 있으면 설명(imageAlt)과 출처(imageSource)가 필요하다", () => {
    expect(questionSchema.safeParse({ ...base, image: "stop-sign.svg" }).success).toBe(false);
    expect(
      questionSchema.safeParse({
        ...base,
        image: "stop-sign.svg",
        imageAlt: "빨간 팔각형 바탕에 흰 글씨가 적힌 표지판",
        imageSource: { kind: "self" },
      }).success,
    ).toBe(true);
  });

  it("공개 자료 그림은 원본 이름과 이용 조건을 적는다", () => {
    const q = { ...base, image: "stop-sign.svg", imageAlt: "빨간 팔각형 바탕에 흰 글씨가 적힌 표지판" };
    expect(questionSchema.safeParse({ ...q, imageSource: { kind: "public" } }).success).toBe(false);
    expect(
      questionSchema.safeParse({
        ...q,
        imageSource: { kind: "public", title: "MUTCD R1-1", license: "미국 연방정부 저작물(public domain)" },
      }).success,
    ).toBe(true);
  });

  it("그림 파일은 .svg 만", () => {
    const q = { ...base, imageAlt: "그림 설명 열 글자 이상", imageSource: { kind: "self" } };
    expect(questionSchema.safeParse({ ...q, image: "photo.png" }).success).toBe(false);
  });
});
