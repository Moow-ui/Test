/**
 * Cloudflare Worker 시작 파일 (wrangler.jsonc 의 main).
 *
 * 사이트 자체는 OpenNext 가 만든 .open-next/worker.js 가 그대로 처리하고,
 * 여기서는 1시간마다 도는 정기 작업(scheduled, wrangler.jsonc 의 triggers.crons)만 덧붙인다.
 *   - IndexNow: sitemap 이 바뀌었으면 바뀐 주소만 검색엔진에 알린다 (lib/server/indexnow.ts)
 *
 * 정기 작업은 배포와 따로 돌기 때문에 여기서 무엇이 실패해도 배포·루틴은 실패하지 않는다. 실패는 로그로만 남긴다.
 * (OpenNext 안내: https://opennext.js.org/cloudflare/howtos/custom-worker)
 * Next 빌드의 타입 검사에서는 뺀다 (tsconfig.json exclude). 빌드 전에는 .open-next 가 없기 때문이다.
 */
import { default as handler } from "./.open-next/worker.js";
import { DOMAIN } from "./config/brand";
import { prepareDb, type D1Like } from "./lib/server/db";
import { runIndexNow } from "./lib/server/indexnow";

interface Env {
  DB?: D1Like;
  [key: string]: unknown;
}

interface Ctx {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

async function indexNowJob(env: Env, ctx: Ctx): Promise<void> {
  try {
    if (!env.DB) {
      console.error("[indexnow] DB 바인딩이 없어 건너뜀");
      return;
    }
    const db = await prepareDb(env.DB);
    const outcome = await runIndexNow({
      db,
      siteUrl: `https://${DOMAIN}`,
      // sitemap 은 같은 Worker 안에서 바로 읽는다 (밖으로 나갔다 들어오지 않게)
      loadText: async (url) => {
        const response = await handler.fetch(new Request(url), env, ctx);
        if (!response.ok) throw new Error(`${url} → ${response.status}`);
        return response.text();
      },
    });
    console.log("[indexnow]", JSON.stringify(outcome));
  } catch (error) {
    console.error("[indexnow] 정기 작업 실패 (배포에는 영향 없음)", error);
  }
}

export default {
  fetch: handler.fetch,
  async scheduled(_controller: unknown, env: Env, ctx: Ctx) {
    ctx.waitUntil(indexNowJob(env, ctx));
  },
};

// OpenNext 가 내보내는 Durable Object 클래스 (이 사이트는 쓰지 않지만 안내대로 그대로 내보낸다)
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
