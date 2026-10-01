import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lib/data.ts 와 OG 이미지가 실행 중에 읽는 파일을 서버 번들에 포함시킨다
  outputFileTracingIncludes: {
    "/**": ["./data/**/*", "./assets/fonts/*"],
  },
};

export default nextConfig;
