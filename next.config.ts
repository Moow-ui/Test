import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import { DOMAIN } from "./config/brand";

/** 언어 경로가 생기기 전의 주소. 모두 한국어 주소(/ko/...)로 옮겼다 */
const LEGACY_PATHS = ["/cert/:path*", "/notes", "/profile"];

/** 예전 신고 목록 주소. 관리자 화면(/admin) 하나로 합쳤다 */
const OLD_ADMIN_PATHS = ["/admin/reports", "/ko/admin/reports", "/en/admin/reports"];

/**
 * Cloudflare 가 기본으로 주는 주소(*.workers.dev)로 들어오면 정식 도메인의 같은 경로로 영구 이동(301)시킨다.
 * (같은 내용이 두 주소에 있으면 검색엔진이 중복으로 본다)
 */
const WORKERS_DEV_HOST = ".*\\.workers\\.dev";

const nextConfig: NextConfig = {
  // OG 이미지가 쓰는 글꼴만 서버 묶음에 넣는다.
  // /data 는 넣지 않는다: 모든 페이지는 빌드 때 만들어지고, 문제는 정적 파일(public/data)로 배포한다.
  // (Worker 는 코드 크기 제한이 있어 자격증이 늘면 배포가 막힌다)
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/*"],
  },
  outputFileTracingExcludes: {
    "/**": ["./data/**/*", "./public/data/**/*"],
  },
  // workers.dev 주소 → 정식 도메인, 예전 주소 → /ko 주소 (301: 검색엔진이 새 주소로 바꿔 기억한다)
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: WORKERS_DEV_HOST }],
        destination: `https://${DOMAIN}/:path*`,
        statusCode: 301 as const,
      },
      ...LEGACY_PATHS.map((source) => ({ source, destination: `/ko${source}`, statusCode: 301 as const })),
      ...OLD_ADMIN_PATHS.map((source) => ({ source, destination: "/admin", statusCode: 301 as const })),
    ];
  },
};

// 개발 서버(npm run dev)에서 wrangler.jsonc 의 바인딩(DB)을 로컬에서 흉내 낸다.
// 회원 정보는 .wrangler 폴더의 로컬 파일에 저장되며 실제 서버와는 별개다.
void initOpenNextCloudflareForDev();

export default nextConfig;
