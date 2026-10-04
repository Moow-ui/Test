/** P15: 디자인 토큰(app/tokens.css)의 명도 대비 자동 검사 — 라이트·다크 모두 WCAG AA */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(path.join(process.cwd(), "app", "tokens.css"), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) vars[name] = value;
  return vars;
}

const light = block(":root");
// 다크는 라이트 값 위에 덮어쓴다
const dark = { ...light, ...block(".dark") };

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [글자, 바탕] — 화면에서 실제로 겹쳐 쓰는 짝 */
const TEXT_PAIRS: Array<[string, string]> = [
  ["ink", "bg"],
  ["ink", "surface"],
  ["ink", "surface-2"],
  ["ink", "primary-soft"],
  ["ink-sub", "bg"],
  ["ink-sub", "surface"],
  ["ink-sub", "surface-2"],
  ["ink-sub", "primary-soft"],
  ["accent", "bg"],
  ["accent", "surface"],
  ["accent", "surface-2"],
  ["accent", "primary-soft"],
  ["on-primary", "primary"],
  ["on-primary", "primary-hover"],
  ["ok", "ok-soft"],
  ["ok", "surface"],
  ["bad", "bad-soft"],
  ["bad", "surface"],
  ...(["basic", "mid", "adv", "cbt"] as const).flatMap((lv): Array<[string, string]> => [
    [`lv-${lv}-ink`, `lv-${lv}-soft`],
    [`on-primary`, `lv-${lv}`],
  ]),
];

/** [테두리·표시, 바탕] — 글자가 아닌 요소는 3:1 (WCAG 1.4.11) */
const UI_PAIRS: Array<[string, string]> = [
  ["focus", "bg"],
  ["focus", "surface"],
  ["primary", "surface"],
  ...(["basic", "mid", "adv", "cbt"] as const).map((lv): [string, string] => [`lv-${lv}-ink`, "surface"]) // 고르기 전 박스의 테두리,
];

describe.each([
  ["라이트", light],
  ["다크", dark],
])("%s 모드 명도 대비", (_name, vars) => {
  it.each(TEXT_PAIRS)("글자 %s / 바탕 %s ≥ 4.5:1", (fg, bg) => {
    expect(vars[fg], fg).toBeDefined();
    expect(vars[bg], bg).toBeDefined();
    expect(ratio(vars[fg], vars[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it.each(UI_PAIRS)("표시 %s / 바탕 %s ≥ 3:1", (fg, bg) => {
    expect(ratio(vars[fg], vars[bg])).toBeGreaterThanOrEqual(3);
  });
});
