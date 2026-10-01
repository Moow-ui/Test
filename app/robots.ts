import type { MetadataRoute } from "next";
import { sitemapPaths } from "@/lib/sitemap";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/**
 * robots.txt
 * 색인하면 안 되는 화면(풀이·오답노트·준비 중·관리 페이지)은 여기서 막지 않고
 * 각 페이지의 <meta name="robots" content="noindex"> 로 처리한다.
 * (robots.txt 로 막으면 검색엔진이 noindex 태그를 읽지 못한다)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    // 언어별 sitemap 을 모두 적는다
    sitemap: sitemapPaths().map(absoluteUrl),
    host: SITE_URL,
  };
}
