import { XML_HEADERS, sitemapIndexXml } from "@/lib/sitemap";

// 언어별 sitemap 목록 (예전부터 검색엔진에 등록해 둔 /sitemap.xml 주소를 그대로 쓴다)
export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapIndexXml(), { headers: XML_HEADERS });
}
