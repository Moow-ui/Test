import { getDb } from "@/lib/server/db";
import { formatLogs, recentLogs } from "@/lib/server/indexnow";

/**
 * IndexNow 제출 기록 확인 주소 (/api/indexnow). 로그인 없이 열린다.
 * 최근 20건의 날짜·제출 주소 수·응답 코드만 보여 준다 (주소 목록은 보여 주지 않는다).
 * 검색엔진에는 내보이지 않는다: noindex 헤더 + robots.txt 차단 (app/robots.ts).
 * 5분 동안은 Cloudflare 캐시에 둔 결과를 돌려줘 반복해서 열어도 D1 을 다시 읽지 않는다.
 */
export const dynamic = "force-dynamic";

const MAX_AGE = 300;
const HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": `public, max-age=${MAX_AGE}`,
  "X-Robots-Tag": "noindex, nofollow",
};

/** Workers 의 기본 캐시 (내 컴퓨터 개발 서버에는 없다) */
function edgeCache(): Cache | null {
  const storage = (globalThis as { caches?: CacheStorage & { default?: Cache } }).caches;
  return storage?.default ?? null;
}

export async function GET(request: Request) {
  const cache = edgeCache();
  const key = new Request(new URL("/api/indexnow", request.url).toString());
  const cached = await cache?.match(key).catch(() => undefined);
  if (cached) return cached;

  const db = await getDb().catch(() => null);
  if (!db) {
    return new Response("db_missing\n", {
      status: 503,
      headers: { ...HEADERS, "Cache-Control": "no-store" },
    });
  }

  const response = new Response(formatLogs(await recentLogs(db, 20)), { headers: HEADERS });
  await cache?.put(key, response.clone()).catch(() => undefined);
  return response;
}
