import { INFO_PAGE_IDS, INFO_UPDATED } from "@/content/pages";
import { getConcepts, getReadyCertifications } from "./data";
import { LOCALES, localeCountry, localePath, type Locale } from "./i18n";
import { languageAlternates } from "./seo";
import { absoluteUrl } from "./site";

/**
 * sitemap — 검색엔진에 색인시킬 페이지만 넣는다.
 * 언어별로 따로 만든다: /sitemaps/ko.xml, /sitemaps/en.xml (목록은 /sitemap.xml).
 * "준비 중" 자격증, 풀이 화면(/quiz, /cbt), 오답노트, 관리 페이지는 넣지 않는다.
 */

export interface SitemapEntry {
  path: string;
  lastModified?: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
  /** hreflang (두 언어에 다 있는 화면만) */
  alternates?: Record<string, string>;
}

export async function sitemapEntries(locale: Locale): Promise<SitemapEntry[]> {
  const certs = await getReadyCertifications(localeCountry(locale));
  const dates = certs.map((c) => c.updatedAt).filter((d): d is string => !!d);
  // 준비된 자격증이 아직 없는 언어의 홈은 빌드한 날을 수정일로 쓴다
  const latest = dates.length > 0 ? dates.sort()[dates.length - 1] : new Date().toISOString().slice(0, 10);

  const entries: SitemapEntry[] = [
    {
      path: localePath(locale),
      lastModified: latest,
      changeFrequency: "weekly",
      priority: 1,
      alternates: languageAlternates(locale, localePath(locale), "/"),
    },
  ];

  for (const cert of certs) {
    const lastModified = cert.updatedAt ?? undefined;
    const base = localePath(locale, `/cert/${cert.id}`);
    entries.push(
      { path: base, lastModified, changeFrequency: "weekly", priority: 0.9 },
      { path: `${base}/past`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    );
    for (const subject of cert.subjects) {
      for (const chapter of subject.chapters) {
        entries.push({ path: `${base}/${chapter.id}`, lastModified, changeFrequency: "monthly", priority: 0.6 });
      }
    }
    // 개념 정리 (검증을 통과한 단원만)
    const concepts = await getConcepts(cert.id);
    if (concepts) {
      entries.push({ path: `${base}/concepts`, lastModified: concepts.verifiedAt, changeFrequency: "monthly", priority: 0.7 });
      for (const chapter of concepts.chapters) {
        entries.push({
          path: `${base}/concepts/${chapter.id}`,
          lastModified: chapter.verifiedAt,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  // 안내 페이지 (소개·문의·개인정보처리방침·이용약관·면책 고지)
  for (const id of INFO_PAGE_IDS) {
    const path = localePath(locale, `/${id}`);
    entries.push({
      path,
      lastModified: INFO_UPDATED,
      changeFrequency: "monthly",
      priority: 0.3,
      alternates: languageAlternates(locale, path, `/${id}`),
    });
  }
  return entries;
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function sitemapXml(entries: SitemapEntry[]): string {
  const urls = entries.map((e) => {
    const lines = [`<loc>${escapeXml(absoluteUrl(e.path))}</loc>`];
    for (const [hreflang, href] of Object.entries(e.alternates ?? {})) {
      lines.push(
        `<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(absoluteUrl(href))}" />`,
      );
    }
    if (e.lastModified) lines.push(`<lastmod>${e.lastModified}</lastmod>`);
    lines.push(`<changefreq>${e.changeFrequency}</changefreq>`, `<priority>${e.priority}</priority>`);
    return `<url>\n${lines.join("\n")}\n</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** 언어별 sitemap 주소 */
export function sitemapPaths(): string[] {
  return LOCALES.map((locale) => `/sitemaps/${locale}.xml`);
}

/** /sitemap.xml — 언어별 sitemap 목록 */
export function sitemapIndexXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapPaths().map((p) => `<sitemap>\n<loc>${escapeXml(absoluteUrl(p))}</loc>\n</sitemap>`),
    "</sitemapindex>",
    "",
  ].join("\n");
}

export const XML_HEADERS = { "Content-Type": "application/xml; charset=utf-8" };
