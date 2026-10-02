import { BRAND } from "@/config/brand";
import en from "@/messages/en.json";
import ko from "@/messages/ko.json";
import type { CertType, Country } from "./types";

/**
 * 다국어 규칙 (서버·화면 공용, 순수 함수).
 *
 *  - 주소: /ko/... (한국어, 한국 자격증), /en/... (영어, 미국 자격증)
 *  - 화면 문구: messages/ko.json, messages/en.json (키 구성이 서로 같아야 한다)
 *  - 번역이 아니라 나라별 별도 콘텐츠다. 자격증은 country 가 맞는 언어에서만 보인다.
 */

export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** 브라우저 언어를 알 수 없을 때 보내는 언어 */
export const DEFAULT_LOCALE: Locale = "en";

const LOCALE_COUNTRY: Record<Locale, Country> = { ko: "KR", en: "US" };

/** 그 언어 경로에 노출하는 자격증의 나라 */
export function localeCountry(locale: Locale): Country {
  return LOCALE_COUNTRY[locale];
}

/** 사용자가 고른 언어를 기억하는 쿠키 */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ko" ? "en" : "ko";
}

/** "/cert/x" → "/ko/cert/x", "/" → "/ko" */
export function localePath(locale: Locale, pathname = "/"): string {
  const rest = pathname === "/" ? "" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${rest}`;
}

/**
 * 브라우저가 선호하는 언어 목록에서 우리 언어를 고른다. 맞는 것이 없으면 DEFAULT_LOCALE.
 * Accept-Language 헤더("ko-KR,ko;q=0.9,en;q=0.8") 또는 navigator.languages 를 넘긴다.
 */
export function pickLocale(preferred: string | readonly string[] | null | undefined): Locale {
  if (!preferred) return DEFAULT_LOCALE;
  const tags =
    typeof preferred === "string"
      ? preferred
          .split(",")
          .map((part) => {
            const [tag, ...params] = part.trim().split(";");
            const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
            const weight = q ? Number(q.slice(2)) : 1;
            return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0 };
          })
          .filter((x) => x.tag !== "" && x.weight > 0)
          .sort((a, b) => b.weight - a.weight)
          .map((x) => x.tag)
      : preferred;

  for (const tag of tags) {
    const language = tag.toLowerCase().split("-")[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

// ───────────────────────── 화면 문구 ─────────────────────────

export type Messages = typeof ko;

const MESSAGES: Record<Locale, Messages> = { ko, en };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}

export function brandName(locale: Locale): string {
  return BRAND[locale].name;
}

/** 목록에서 자격증 이름 아래에 보여 주는 분류 한마디: 등급이 있으면 등급, 없으면 자격 종류 이름 */
export function certKind(m: Messages, cert: { grade?: string; certType: CertType }): string {
  return cert.grade ?? m.certTypes[cert.certType];
}

/** "{n}문제" + { n: 5 } → "5문제" */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}
