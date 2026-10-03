/**
 * 빌드 결과 SEO 검사.
 *   npm run build  →  npm run check:meta
 *
 * 검사 항목
 *   1. 색인 대상 페이지의 title·description·H1 이 서로 중복되지 않는가
 *   2. 색인 대상 페이지에 canonical 과 H1(1개)이 있는가
 *   3. noindex 페이지(준비 중·풀이 화면 등)가 sitemap.xml 에 들어 있지 않은가
 *   4. 색인 대상 페이지가 sitemap.xml 에 빠짐없이 들어 있는가
 *   5. 기출·단원 페이지의 HTML 에 대표 문제의 정답·해설 텍스트가 들어 있는가
 *   6. 모든 페이지에 hreflang(ko, en, x-default)이 있고, <html lang> 과 사이트 이름이 주소의 언어와 맞는가
 */
import fs from "node:fs";
import path from "node:path";
import { CIRCLED as CIRCLED_NUMBERS } from "../lib/format";
import { LOCALES, brandName, getMessages, isLocale, type Locale } from "../lib/i18n";

const APP_DIR = path.join(process.cwd(), ".next", "server", "app");

if (!fs.existsSync(APP_DIR)) {
  console.error("빌드 결과(.next)가 없습니다. 먼저 `npm run build` 를 실행하세요.");
  process.exit(1);
}

interface Page {
  route: string;
  title: string;
  description: string;
  canonical: string;
  h1: string[];
  noindex: boolean;
  html: string;
  /** 주소의 언어 (/ko/..., /en/...) */
  locale: Locale | null;
  /** <html lang="..."> */
  htmlLang: string;
  /** hreflang → 주소 */
  hreflang: Record<string, string>;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".html") ? [full] : [];
  });
}

function decode(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attr(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  return match ? decode(match[1]) : "";
}

function stripTags(html: string): string {
  return decode(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function toRoute(file: string): string {
  const relative = path.relative(APP_DIR, file).replace(/\\/g, "/").replace(/\.html$/, "");
  return relative === "index" ? "/" : `/${relative}`;
}

const pages: Page[] = walk(APP_DIR)
  .filter((file) => !/[\\/]_(not-found|global-error)\.html$/.test(file))
  .map((file) => {
    const html = fs.readFileSync(file, "utf8");
    const robots = attr(html, /<meta name="robots" content="([^"]*)"/);
    const route = toRoute(file);
    const first = route.split("/")[1];
    const hreflang: Record<string, string> = {};
    for (const tag of html.match(/<link rel="alternate"[^>]*>/g) ?? []) {
      const lang = tag.match(/hrefLang="([^"]*)"/i)?.[1];
      const href = tag.match(/href="([^"]*)"/)?.[1];
      if (lang && href) hreflang[lang] = decode(href);
    }
    return {
      route,
      locale: isLocale(first) ? first : null,
      htmlLang: attr(html, /<html[^>]* lang="([^"]*)"/),
      hreflang,
      title: attr(html, /<title>([^<]*)<\/title>/),
      description: attr(html, /<meta name="description" content="([^"]*)"/),
      canonical: attr(html, /<link rel="canonical" href="([^"]*)"/),
      h1: Array.from(html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)).map((m) => stripTags(m[1])),
      noindex: robots.includes("noindex"),
      html,
    };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

const indexable = pages.filter((p) => !p.noindex);
const errors: string[] = [];
const warnings: string[] = [];

// 1) 중복 검사
function findDuplicates(label: string, pick: (p: Page) => string): void {
  const groups = new Map<string, string[]>();
  for (const p of indexable) {
    const value = pick(p);
    if (!value) {
      errors.push(`${label} 없음: ${p.route}`);
      continue;
    }
    groups.set(value, [...(groups.get(value) ?? []), p.route]);
  }
  for (const [value, routes] of groups) {
    if (routes.length > 1) errors.push(`${label} 중복 (${routes.join(", ")}): "${value}"`);
  }
}
findDuplicates("title", (p) => p.title);
findDuplicates("description", (p) => p.description);
findDuplicates("H1", (p) => p.h1[0] ?? "");

// 2) canonical, H1 개수
for (const p of indexable) {
  if (!p.canonical) errors.push(`canonical 없음: ${p.route}`);
  else if (new URL(p.canonical).pathname.replace(/\/$/, "") !== p.route.replace(/\/$/, "")) {
    errors.push(`canonical 이 자기 주소와 다름: ${p.route} → ${p.canonical}`);
  }
  if (p.h1.length !== 1) errors.push(`H1 이 ${p.h1.length}개: ${p.route} (1개여야 함)`);
}

// 3, 4) sitemap — 언어별로 따로 있다 (/sitemaps/ko.xml, /sitemaps/en.xml), /sitemap.xml 은 그 목록
const indexFile = path.join(APP_DIR, "sitemap.xml.body");
if (!fs.existsSync(indexFile)) errors.push("sitemap.xml 이 빌드 결과에 없습니다");
const byRoute = new Map(pages.map((p) => [p.route, p]));
for (const locale of LOCALES) {
  const name = `sitemaps/${locale}.xml`;
  const sitemapFile = path.join(APP_DIR, "sitemaps", `${locale}.xml.body`);
  if (!fs.existsSync(sitemapFile)) {
    errors.push(`${name} 이 빌드 결과에 없습니다`);
    continue;
  }
  if (fs.existsSync(indexFile) && !fs.readFileSync(indexFile, "utf8").includes(`/${name}<`)) {
    errors.push(`sitemap.xml 목록에 ${name} 이 없습니다`);
  }
  const xml = fs.readFileSync(sitemapFile, "utf8");
  const sitemapRoutes = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(
    (m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/",
  );
  const lastmodCount = (xml.match(/<lastmod>/g) ?? []).length;
  if (lastmodCount !== sitemapRoutes.length) {
    errors.push(`${name}: lastmod 가 없는 항목이 있습니다 (${lastmodCount}/${sitemapRoutes.length})`);
  }
  for (const route of sitemapRoutes) {
    const page = byRoute.get(route);
    if (!page) errors.push(`${name} 에 있는데 페이지가 없음: ${route}`);
    else if (page.noindex) errors.push(`noindex 페이지가 ${name} 에 들어 있음: ${route}`);
    else if (page.locale !== locale) errors.push(`${name} 에 다른 언어 주소가 들어 있음: ${route}`);
  }
  for (const p of indexable.filter((x) => x.locale === locale)) {
    if (!sitemapRoutes.includes(p.route)) errors.push(`색인 대상인데 ${name} 에 없음: ${p.route}`);
  }
  console.log(`${name}: ${sitemapRoutes.length}개 주소`);
}

// 5) 기출·단원 페이지에 문제·정답·해설이 HTML 로 들어 있는가
const CIRCLED = `[${CIRCLED_NUMBERS.join("")}]`;
const contentPages = indexable.filter((p) => /^\/[^/]+\/cert\/[^/]+\/[^/]+$/.test(p.route));
for (const p of contentPages) {
  if (!p.locale) continue;
  const m = getMessages(p.locale).question;
  const hasQuestions = p.html.includes(m.showAnswer);
  // React 는 글자 사이에 <!-- --> 를 끼워 넣는다: "정답:<!-- --> <!-- -->①"
  const answerAt = p.html.indexOf(m.answerIs);
  const afterAnswer = answerAt === -1 ? "" : p.html.slice(answerAt + m.answerIs.length, answerAt + 60);
  const hasAnswer = new RegExp(`^(?:<!-- -->| )*${CIRCLED}`).test(afterAnswer);
  if (!hasQuestions || !hasAnswer) {
    warnings.push(`대표 문제·정답이 HTML 에 없음: ${p.route}`);
  }
}

// 6) 언어: 주소의 언어, <html lang>, 사이트 이름, hreflang
const pathOf = (url: string) => new URL(url, "http://x").pathname.replace(/\/$/, "") || "/";
for (const p of pages) {
  if (!p.locale) {
    errors.push(`언어 경로(/ko, /en) 밖에 있는 페이지: ${p.route}`);
    continue;
  }
  if (p.htmlLang !== p.locale) errors.push(`<html lang="${p.htmlLang}"> 이 주소의 언어와 다름: ${p.route}`);
  if (!p.title.includes(brandName(p.locale))) errors.push(`title 에 사이트 이름(${brandName(p.locale)})이 없음: ${p.route}`);
  for (const other of LOCALES) {
    if (other !== p.locale && p.title.includes(brandName(other))) {
      errors.push(`title 에 다른 언어의 사이트 이름이 들어 있음: ${p.route}`);
    }
  }
  for (const key of [...LOCALES, "x-default"]) {
    if (!p.hreflang[key]) errors.push(`hreflang="${key}" 없음: ${p.route}`);
  }
  const self = p.hreflang[p.locale];
  if (self && pathOf(self) !== p.route) errors.push(`hreflang="${p.locale}" 이 자기 주소가 아님: ${p.route} → ${self}`);
  for (const [key, href] of Object.entries(p.hreflang)) {
    const target = pathOf(href);
    // x-default 가 가리키는 "/" 는 언어를 골라 보내는 주소(app/route.ts)라 HTML 이 없다
    if (target !== "/" && !byRoute.has(target)) errors.push(`hreflang="${key}" 이 없는 주소를 가리킴: ${p.route} → ${href}`);
  }
}

// 결과 출력
console.log(`\n전체 페이지 ${pages.length}개 (색인 대상 ${indexable.length}개, noindex ${pages.length - indexable.length}개)\n`);
console.log("── 색인 대상 ──");
for (const p of indexable) console.log(`  ${p.route}\n     ${p.title}`);
console.log("\n── noindex (sitemap 제외) ──");
const noindexPages = pages.filter((p) => p.noindex);
const preview = noindexPages.slice(0, 8);
for (const p of preview) console.log(`  ${p.route}`);
if (noindexPages.length > preview.length) console.log(`  … 외 ${noindexPages.length - preview.length}개`);

if (warnings.length > 0) {
  console.log(`\n주의 ${warnings.length}건`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length > 0) {
  console.error(`\n오류 ${errors.length}건`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log("\nSEO 검사 통과 ✓ (title·description·H1 중복 없음, noindex 페이지는 sitemap 에서 제외됨, hreflang 확인됨)");
