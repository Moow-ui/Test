import type { Metadata } from "next";
import { LOCALES, brandName, fmt, getMessages, localePath, otherLocale, writtenVars, type Locale } from "./i18n";
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

/**
 * 검색 결과에서 설명이 "…"으로 잘리지 않는 최대 너비.
 * 한글·한자 1칸, 영문·숫자·기호·띄어쓰기 0.5칸으로 센다 (한국어 80자, 영어 약 160자).
 */
export const DESCRIPTION_MAX_WIDTH = 80;

/** 검색 결과에 보이는 글자 너비 (한글 1, 그 밖 0.5) */
export function textWidth(text: string): number {
  let width = 0;
  for (const ch of text) width += /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(ch) ? 1 : 0.5;
  return width;
}

/** 단원명 끝의 괄호 설명을 뺀 이름 (예: "민사특별법 (주택·상가 임대차, …)" → "민사특별법") */
function withoutTrailingParen(name: string): string {
  return name.replace(/\s*\([^()]*\)\s*$/, "").trim() || name;
}

/**
 * 설명 문구 틀(긴 것부터 짧은 것 순서)과 변수 묶음(바꿀 값이 적은 것부터)을 차례로 넣어 보고,
 * 너비 안에 들어오는 첫 문구를 고른다. 모두 넘치면 가장 짧은 문구를 쓴다.
 */
function fitDescription(templates: readonly string[], varsList: Record<string, string | number>[]): string {
  let shortest = "";
  for (const vars of varsList) {
    for (const template of templates) {
      const text = fmt(template, vars);
      if (textWidth(text) <= DESCRIPTION_MAX_WIDTH) return text;
      if (!shortest || textWidth(text) < textWidth(shortest)) shortest = text;
    }
  }
  return shortest;
}

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
    const vars = { name: cert.name, brand, ...writtenVars(locale, cert.writtenExam) };
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
    ...writtenVars(locale, cert.writtenExam),
    total: cert.examInfo.totalQuestions,
    subjects: cert.subjects.map((s) => s.name).join(m.subjectSeparator),
  };
  return {
    title: fmt(m.certMain.title, vars),
    description: fitDescription(m.certMain.descriptions, [vars]),
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
  const vars = {
    name: cert.name,
    spaced: cert.spacedName,
    shown: shownCount,
    brand: brandName(locale),
    ...writtenVars(locale, cert.writtenExam),
  };
  return {
    title: fmt(t.title, vars),
    description: fitDescription(t.descriptions, [vars]),
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
  // examWeight 는 과목 안에서의 비중이다. 과목이 하나뿐이면 시험 전체 비중과 같으므로 과목명을 붙이지 않는다
  const single = cert.subjects.length === 1;
  const weightVars = { subject: subject.name, weight: chapter.examWeight };
  const vars = {
    weightLabel: fmt(single ? m.weightAll : m.weightInSubject, weightVars),
    weightShort: fmt(single ? m.weightAll : m.weightInSubjectShort, weightVars),
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
    description: fitDescription(m.descriptions, [vars, { ...vars, chapter: withoutTrailingParen(chapter.name) }]),
    h1: fmt(m.h1, vars),
    path: localePath(locale, `/cert/${cert.id}/${chapter.id}`),
  };
}

/** 자격증 개념 정리 (단원 목차 + 단원별 핵심 개념) */
export function conceptsMeta(locale: Locale, cert: Certification, chapterCount: number): PageMeta {
  const m = getMessages(locale);
  const vars = {
    name: cert.name,
    subjects: cert.subjects.length,
    chapters: chapterCount,
    brand: brandName(locale),
    ...writtenVars(locale, cert.writtenExam),
  };
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
    description: fitDescription(m.seo.conceptChapter.descriptions, [
      vars,
      { ...vars, chapter: withoutTrailingParen(chapter.name) },
    ]),
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
