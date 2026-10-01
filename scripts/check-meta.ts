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
 */
import fs from "node:fs";
import path from "node:path";

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
    return {
      route: toRoute(file),
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

// 3, 4) sitemap
const sitemapFile = path.join(APP_DIR, "sitemap.xml.body");
if (!fs.existsSync(sitemapFile)) {
  errors.push("sitemap.xml 이 빌드 결과에 없습니다");
} else {
  const xml = fs.readFileSync(sitemapFile, "utf8");
  const sitemapRoutes = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map(
    (m) => new URL(m[1]).pathname.replace(/\/$/, "") || "/",
  );
  const lastmodCount = (xml.match(/<lastmod>/g) ?? []).length;
  if (lastmodCount !== sitemapRoutes.length) {
    errors.push(`sitemap: lastmod 가 없는 항목이 있습니다 (${lastmodCount}/${sitemapRoutes.length})`);
  }
  const byRoute = new Map(pages.map((p) => [p.route, p]));
  for (const route of sitemapRoutes) {
    const page = byRoute.get(route);
    if (!page) errors.push(`sitemap 에 있는데 페이지가 없음: ${route}`);
    else if (page.noindex) errors.push(`noindex 페이지가 sitemap 에 들어 있음: ${route}`);
  }
  for (const p of indexable) {
    if (!sitemapRoutes.includes(p.route)) errors.push(`색인 대상인데 sitemap 에 없음: ${p.route}`);
  }
  console.log(`sitemap.xml: ${sitemapRoutes.length}개 주소`);
}

// 5) 기출·단원 페이지에 문제·정답·해설이 HTML 로 들어 있는가
const contentPages = indexable.filter((p) => /^\/cert\/[^/]+\/[^/]+$/.test(p.route));
for (const p of contentPages) {
  const questionCount = (p.html.match(/정답과 해설 보기/g) ?? []).length;
  const hasAnswer = /정답: <!-- -->[①②③④]|정답: [①②③④]/.test(p.html);
  if (questionCount === 0 || !hasAnswer) {
    warnings.push(`대표 문제·정답이 HTML 에 없음: ${p.route}`);
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
console.log("\nSEO 검사 통과 ✓ (title·description·H1 중복 없음, noindex 페이지는 sitemap 에서 제외됨)");
