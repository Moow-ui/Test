// Cloudflare Workers 용 OpenNext 설정
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// 이 사이트의 모든 페이지는 빌드 때 만들어지는 정적 페이지라서,
// 별도 저장소(R2·KV) 없이 배포 파일에 들어 있는 결과를 그대로 내보낸다.
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
