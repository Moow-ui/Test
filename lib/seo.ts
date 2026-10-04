import type { Metadata } from "next";
import { LOCALES, brandName, fmt, getMessages, localePath, otherLocale, type Locale } from "./i18n";
import { absoluteUrl } from "./site";
import type { Certification, Chapter, Faq, Subject } from "./types";

/**
 * 검색 노출용 문구 규칙.
 * 페이지마다 title·description·H1 이 서로 달라야 하므로 문구는 모두 여기서 만든다.
 * 문구 틀은 messages/{ko,en}.json 의 "seo" 에 있다.
 * (빌드 후 `npm run check:meta` 가 중복을 검사한다)
 */

export interface PageMeta {
  title: string;
  description: string;
  h1: string;
  /** 언어 경로가 붙은 주소 (예: /ko/cert/forklift-operator) */
  path: string;
}

const OG_LOCALE: Record<Locale, string> = { ko: "ko_KR", en: "en_US" };

/** 홈 */
export function homeMeta(locale: Locale): PageMeta {
  const m = getMessages(locale);
  return {
    title: `${brandName(locale)} | ${m.site.titleSuffix}`,
    description: m.site.description,
    h1: `${m.home.h1a} ${m.home.h1b}`,
    path: localePath(locale),
  };
}

/** 자격증 메인 */
export function certMainMeta(locale: Locale, cert: Certification): PageMeta {
  const m = getMessages(locale).seo;
  const brand = brandName(locale);
  const path = localePath(locale, `/cert/${cert.id}`);
  if (!cert.ready || !cert.examInfo) {
    const vars = { name: cert.name, brand };
    return {
      title: fmt(m.certSoon.title, vars),
      description: fmt(m.certSoon.description, vars),
      h1: fmt(m.certSoon.h1, vars),
      path,
    };
  }
  const vars = {
    name: cert.name,
    brand,
    total: cert.examInfo.totalQuestions,
    subjects: cert.subjects.map((s) => s.name).join(m.subjectSeparator),
  };
  return {
    title: fmt(m.certMain.title, vars),
    description: fmt(m.certMain.description, vars),
    h1: fmt(m.certMain.h1, vars),
    path,
  };
}

/** 기출문제 페이지. 기출 데이터가 아직 없으면 "기출 유형 문제"로 정직하게 표기한다 */
export function certPastMeta(
  locale: Locale,
  cert: Certification,
  hasPast: boolean,
  shownCount: number,
): PageMeta {
  const m = getMessages(locale).seo;
  const t = hasPast ? m.past : m.pastType;
  const vars = { name: cert.name, spaced: cert.spacedName, shown: shownCount, brand: brandName(locale) };
  return {
    title: fmt(t.title, vars),
    description: fmt(t.description, vars),
    h1: fmt(t.h1, vars),
    path: localePath(locale, `/cert/${cert.id}/past`),
  };
}

/** 단원별 핵심정리 페이지 */
export function chapterMeta(
  locale: Locale,
  cert: Certification,
  subject: Subject,
  chapter: Chapter,
  hasPast: boolean,
): PageMeta {
  const m = getMessages(locale).seo.chapter;
  const vars = {
    name: cert.name,
    subject: subject.name,
    chapter: chapter.name,
    kind: hasPast ? m.kindPast : m.kindPredicted,
    weight: chapter.examWeight,
    importance: chapter.importance,
    summary: firstSentence(chapter.summary),
    brand: brandName(locale),
  };
  return {
    title: fmt(m.title, vars),
    description: fmt(m.description, vars),
    h1: fmt(m.h1, vars),
    path: localePath(locale, `/cert/${cert.id}/${chapter.id}`),
  };
}

/** 자격증 개념 정리 (단원 목차 + 단원별 핵심 개념) */
export function conceptsMeta(locale: Locale, cert: Certification, chapterCount: number): PageMeta {
  const m = getMessages(locale);
  const vars = { name: cert.name, subjects: cert.subjects.length, chapters: chapterCount, brand: brandName(locale) };
  return {
    title: fmt(m.seo.concepts.title, vars),
    description: fmt(m.seo.concepts.description, vars),
    h1: fmt(m.concepts.h1, vars),
    path: localePath(locale, `/cert/${cert.id}/concepts`),
  };
}

/** 단원 개념 정리 */
export function conceptChapterMeta(
  locale: Locale,
  cert: Certification,
  subject: Subject,
  chapter: Chapter,
  conceptCount: number,
  firstDefinition: string,
): PageMeta {
  const m = getMessages(locale);
  const vars = {
    name: cert.name,
    subject: subject.name,
    chapter: chapter.name,
    n: conceptCount,
    first: firstSentence(firstDefinition),
    brand: brandName(locale),
  };
  return {
    title: fmt(m.seo.conceptChapter.title, vars),
    description: fmt(m.seo.conceptChapter.description, vars),
    h1: fmt(m.concepts.chapterH1, vars),
    path: localePath(locale, `/cert/${cert.id}/concepts/${chapter.id}`),
  };
}

/** Article 구조화 데이터 (개념 정리). 쓴 주체는 사이트(단체)로 적는다 */
export function articleJsonLd(locale: Locale, meta: PageMeta, dateModified: string) {
  const publisher = { "@type": "Organization", name: brandName(locale), url: absoluteUrl(localePath(locale)) };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.h1,
    description: meta.description,
    inLanguage: locale,
    mainEntityOfPage: absoluteUrl(meta.path),
    datePublished: dateModified,
    dateModified,
    author: publisher,
    publisher,
  };
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}

export interface Crumb {
  name: string;
  path: string;
}

/** BreadcrumbList 구조화 데이터 */
export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

/** FAQPage 구조화 데이터 */
export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/**
 * hreflang (ko, en, x-default).
 *
 * shared: 두 언어에 같은 주소가 있는 화면(홈·오답노트·내 정보 등)의, 언어 경로를 뺀 주소. 예: "/", "/notes"
 *   → ko·en 이 서로를 가리키고, x-default 는 홈이면 "/"(언어 감지), 그 밖에는 기본 언어.
 * shared 가 없으면 나라별 콘텐츠(자격증 화면)다. 다른 언어에 같은 내용의 페이지가 없으므로
 *   → 자기 언어와 x-default 는 자기 자신, 다른 언어는 그 언어의 홈을 가리킨다.
 */
export function languageAlternates(
  locale: Locale,
  path: string,
  shared?: string,
): Record<string, string> {
  if (shared !== undefined) {
    return {
      ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, shared)])),
      "x-default": shared === "/" ? "/" : localePath("en", shared),
    };
  }
  const other = otherLocale(locale);
  return { [locale]: path, [other]: localePath(other), "x-default": path };
}

/**
 * PageMeta → Next.js Metadata (canonical, hreflang, OG, noindex 포함).
 * ogImagePath: 하위 페이지(기출·단원)는 openGraph 를 새로 정하면서 상위의 OG 이미지가 빠지므로
 * 자격증 OG 이미지 주소를 직접 넘겨 준다.
 */
export function toMetadata(
  locale: Locale,
  meta: PageMeta,
  options: { noindex?: boolean; ogImagePath?: string; shared?: string } = {},
): Metadata {
  const images = options.ogImagePath
    ? [{ url: options.ogImagePath, width: 1200, height: 630, alt: meta.h1 }]
    : undefined;
  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.path,
      languages: languageAlternates(locale, meta.path, options.shared),
    },
    robots: options.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: brandName(locale),
      locale: OG_LOCALE[locale],
      title: meta.title,
      description: meta.description,
      url: meta.path,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}

/**
 * 검색엔진이 색인하면 안 되는 화면(풀이·오답노트 등)의 Metadata.
 * text: messages 의 seo.* 항목({ title, description }), vars: 틀에 넣을 값.
 */
export function noindexMetadata(
  locale: Locale,
  text: { title: string; description: string },
  path: string,
  options: { vars?: Record<string, string | number>; shared?: string } = {},
): Metadata {
  const vars = { ...options.vars, brand: brandName(locale) };
  const fullPath = localePath(locale, path);
  return {
    title: fmt(text.title, vars),
    description: fmt(text.description, vars),
    alternates: { languages: languageAlternates(locale, fullPath, options.shared) },
    robots: { index: false, follow: false },
  };
}

/**
 * 자격증별 OG 이미지 주소 (app/[lang]/cert/[slug]/opengraph-image.tsx).
 * 이 파일은 일부러 (site) 묶음 밖에 둔다. 묶음 안에 두면 주소 끝에 임의의 꼬리표가 붙어 주소를 미리 알 수 없다.
 */
export function certOgImagePath(locale: Locale, certId: string): string {
  return localePath(locale, `/cert/${certId}/opengraph-image`);
}
