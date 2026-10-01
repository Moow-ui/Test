import { LOCALES, isLocale } from "@/lib/i18n";
import { XML_HEADERS, sitemapEntries, sitemapXml } from "@/lib/sitemap";

// 언어별 sitemap (/sitemaps/ko.xml, /sitemaps/en.xml). 빌드 때 미리 만들어 두는 정적 파일이다
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ file: `${lang}.xml` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const lang = (await params).file.replace(/\.xml$/, "");
  if (!isLocale(lang)) return new Response(null, { status: 404 });
  return new Response(sitemapXml(await sitemapEntries(lang)), { headers: XML_HEADERS });
}
