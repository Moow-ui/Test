import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "./site";
import type { Certification, Chapter, Faq, Subject } from "./types";

/**
 * 검색 노출용 문구 규칙.
 * 페이지마다 title·description·H1 이 서로 달라야 하므로 문구는 모두 여기서 만든다.
 * (빌드 후 `npm run check:meta` 가 중복을 검사한다)
 */

export interface PageMeta {
  title: string;
  description: string;
  h1: string;
  path: string;
}

/** 자격증 메인 */
export function certMainMeta(cert: Certification): PageMeta {
  const path = `/cert/${cert.id}`;
  if (!cert.ready || !cert.examInfo) {
    return {
      title: `${cert.name} 필기 문제 준비 중 | ${SITE_NAME}`,
      description: `${cert.name} 필기 문제와 출제 분석을 준비하고 있습니다. 지금 풀 수 있는 다른 자격증 문제를 먼저 확인해 보세요.`,
      h1: `${cert.name} 필기 문제 준비 중`,
      path,
    };
  }
  const subjects = cert.subjects.map((s) => s.name).join("·");
  return {
    title: `${cert.name} 필기 기출문제·출제경향 | ${SITE_NAME}`,
    description: `${cert.name} 필기 ${cert.examInfo.totalQuestions}문항(${subjects})의 과목별 출제 비중과 단원별 중요도를 확인하고, 초급·중급·고급 문제를 5문제부터 바로 풀어 보세요. 로그인 없이 무료입니다.`,
    h1: `${cert.name} 필기 시험 정보와 출제경향`,
    path,
  };
}

/** 기출문제 페이지. 기출 데이터가 아직 없으면 "기출 유형 문제"로 정직하게 표기한다 */
export function certPastMeta(cert: Certification, hasPast: boolean, shownCount: number): PageMeta {
  const path = `/cert/${cert.id}/past`;
  if (hasPast) {
    return {
      title: `${cert.name} 기출문제 무료 풀이 + 해설 | ${SITE_NAME}`,
      description: `${cert.name} 기출문제 ${shownCount}개를 정답과 쉬운 해설까지 한 페이지에서 볼 수 있습니다. ${cert.spacedName} 필기를 준비한다면 자주 나오는 문제부터 읽어 보세요.`,
      h1: `${cert.name} 기출문제 풀이와 해설`,
      path,
    };
  }
  return {
    title: `${cert.name} 기출 유형 문제 무료 풀이 + 해설 | ${SITE_NAME}`,
    description: `${cert.name} 필기 기출 유형을 분석해 만든 대표 문제 ${shownCount}개를 정답과 쉬운 해설까지 한 페이지에서 볼 수 있습니다. ${cert.spacedName} 시험에 자주 나오는 개념부터 확인하세요.`,
    h1: `${cert.name} 기출 유형 문제 풀이와 해설`,
    path,
  };
}

/** 단원별 핵심정리 페이지 */
export function chapterMeta(
  cert: Certification,
  subject: Subject,
  chapter: Chapter,
  hasPast: boolean,
): PageMeta {
  const kind = hasPast ? "기출문제" : "예상문제";
  return {
    title: `${cert.name} ${chapter.name} 핵심정리·${kind} | ${SITE_NAME}`,
    description: `${cert.name} ${subject.name} 과목 '${chapter.name}' 단원의 핵심 정리와 대표 문제입니다. 과목 내 출제 비중 ${chapter.examWeight}%, 중요도 ${chapter.importance}/5. ${firstSentence(chapter.summary)}`,
    h1: `${cert.name} ${chapter.name} 핵심정리`,
    path: `/cert/${cert.id}/${chapter.id}`,
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

/** PageMeta → Next.js Metadata (canonical, OG, noindex 포함) */
export function toMetadata(meta: PageMeta, options: { noindex?: boolean } = {}): Metadata {
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.path },
    robots: options.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: meta.title,
      description: meta.description,
      url: meta.path,
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  };
}

/** 검색엔진이 색인하면 안 되는 화면(풀이·오답노트 등)의 Metadata */
export function noindexMetadata(title: string, description: string): Metadata {
  return { title, description, robots: { index: false, follow: false } };
}
