import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lib/data.ts 와 OG 이미지가 실행 중에 읽는 파일을 서버 번들에 포함시킨다
  outputFileTracingIncludes: {
    "/**": ["./data/**/*", "./assets/fonts/*"],
  },
};

// 개발 서버(npm run dev)에서 wrangler.jsonc 의 바인딩(DB)을 로컬에서 흉내 낸다.
// 회원 정보는 .wrangler 폴더의 로컬 파일에 저장되며 실제 서버와는 별개다.
void initOpenNextCloudflareForDev();

export default nextConfig;
