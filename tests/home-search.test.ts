// @vitest-environment happy-dom
/** P13: 홈 검색창 자동완성 (초성·띄어쓰기 무시·결과 없음 안내) */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCertList } from "@/lib/data";
import type { CertListItem } from "@/lib/types";

vi.mock("next/navigation", () => ({ useParams: () => ({ lang: "ko" }), useRouter: () => ({ push: () => {} }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) =>
    createElement("a", { href, ...rest }, children as never),
}));

const { CertSearch } = await import("@/components/home/CertSearch");
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let certs: CertListItem[];
let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  certs ??= await getCertList("KR");
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(createElement(CertSearch, { certs }));
  });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** React 가 감지하도록 입력값을 바꾼다 */
function type(text: string) {
  const input = container.querySelector("input")!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setter.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
const options = () => [...container.querySelectorAll('[role="option"]')].map((o) => o.textContent ?? "");

describe("홈 검색 자동완성", () => {
  it("안내 문구가 보이고, 입력 전에는 목록이 없다", () => {
    expect(container.querySelector("input")!.placeholder).toBe("어떤 자격증 문제를 풀어볼까요?");
    expect(options()).toHaveLength(0);
  });

  it("데이터의 자격증 이름을 초성으로 찾는다", () => {
    const target = certs[0];
    type(Array.from(target.name.replace(/\s/g, "")).map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      return code >= 0 && code < 11172 ? "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"[Math.floor(code / 588)] : ch;
    }).join(""));
    expect(options().some((o) => o.includes(target.name))).toBe(true);
  });

  it("띄어쓰기를 무시한다", () => {
    const target = certs.find((c) => c.name.replace(/\s/g, "").length >= 4)!;
    const name = target.name.replace(/\s/g, "");
    type(`${name.slice(0, 2)} ${name.slice(2)}`);
    expect(options().some((o) => o.includes(target.name))).toBe(true);
  });

  it("결과가 없으면 '아직 없는 자격증이에요'", () => {
    type("없는자격증이름xyz");
    expect(options()).toHaveLength(0);
    expect(container.textContent).toContain("아직 없는 자격증이에요");
  });
});
