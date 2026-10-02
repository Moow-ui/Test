import { getAdminIdentity } from "@/lib/server/access";
import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

/**
 * 신고를 "처리 완료 / 처리 전"으로 표시한다 (관리자 전용).
 * Cloudflare Access 토큰이 없는 요청은 이런 주소가 없는 것처럼 404 로 답한다.
 */
export async function POST(request: Request) {
  if (!(await getAdminIdentity(request.headers))) return json({ error: "not_found" }, 404);
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const body = (await request.json().catch(() => null)) as { id?: unknown; resolved?: unknown } | null;
  if (typeof body?.id !== "string" || typeof body.resolved !== "boolean") {
    return json({ error: "bad_request" }, 400);
  }
  await db
    .prepare("UPDATE reports SET resolved_at = ? WHERE id = ?")
    .bind(body.resolved ? Date.now() : null, body.id)
    .run();
  return json({ ok: true });
}
