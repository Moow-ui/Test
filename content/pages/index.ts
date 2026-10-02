import { DOMAIN } from "@/config/brand";
import { brandName, fmt, getMessages, localePath, type Locale } from "@/lib/i18n";
import type { PageMeta } from "@/lib/seo";
import { enPages } from "./en";
import { koPages } from "./ko";

/**
 * 안내 페이지 (소개·문의·개인정보처리방침·이용약관·면책 고지).
 *
 * 화면 문구(messages)와 달리 긴 글이고, 나라마다 내용 구성이 달라서 언어별 파일로 따로 둔다
 * (content/pages/ko.ts, en.ts). 화면은 app/[lang]/(site)/[page]/page.tsx 하나가 모두 그린다.
 * 글을 고치면 아래 INFO_UPDATED(시행일)도 함께 고친다.
 */

export const INFO_PAGE_IDS = ["about", "contact", "privacy", "terms", "disclaimer"] as const;
export type InfoPageId = (typeof INFO_PAGE_IDS)[number];

export interface InfoPage {
  title: string;
  description: string;
  sections: Array<{ heading: string; body: string }>;
}
export type InfoPages = Record<InfoPageId, InfoPage>;

/** 시행일 = 마지막으로 고친 날 (sitemap 의 lastmod 에도 쓴다) */
export const INFO_UPDATED = "2026-10-02";

const PAGES: Record<Locale, InfoPages> = { ko: koPages, en: enPages };

export function isInfoPageId(value: string): value is InfoPageId {
  return (INFO_PAGE_IDS as readonly string[]).includes(value);
}

function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** 본문의 {brand}·{email}·{date}·{domain} 을 채운 안내 페이지. email 이 없으면 "준비 중" 문구가 들어간다 */
export function getInfoPage(locale: Locale, id: InfoPageId, email: string | null): InfoPage {
  const vars = {
    brand: brandName(locale),
    email: email ?? getMessages(locale).info.emailPending,
    date: formatDate(locale, INFO_UPDATED),
    domain: DOMAIN,
  };
  const page = PAGES[locale][id];
  return {
    title: fmt(page.title, vars),
    description: fmt(page.description, vars),
    sections: page.sections.map((s) => ({ heading: fmt(s.heading, vars), body: fmt(s.body, vars) })),
  };
}

/** 검색 노출용 문구 (title·description·H1 이 페이지마다 다르다) */
export function infoPageMeta(locale: Locale, id: InfoPageId): PageMeta {
  const page = getInfoPage(locale, id, null);
  return {
    title: fmt(getMessages(locale).seo.info.title, { title: page.title, brand: brandName(locale) }),
    description: page.description,
    h1: page.title,
    path: localePath(locale, `/${id}`),
  };
}
