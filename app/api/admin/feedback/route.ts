import { getAdminIdentity } from "@/lib/server/access";
import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { FEEDBACK_ADMIN_ACTIONS, setFeedbackState } from "@/lib/server/feedback";

/**
 * 개선 의견 처리 완료 / 처리 전으로 / 삭제 (관리자 전용).
 * Cloudflare Access 토큰이 없는 요청은 이런 주소가 없는 것처럼 404 로 답한다.
 */
export async function POST(request: Request) {
  if (!(await getAdminIdentity(request.headers))) return json({ error: "not_found" }, 404);
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const body = (await request.json().catch(() => null)) as { id?: unknown; action?: unknown } | null;
  const action = FEEDBACK_ADMIN_ACTIONS.find((a) => a === body?.action);
  if (typeof body?.id !== "string" || !action) return json({ error: "bad_request" }, 400);

  await setFeedbackState(db, body.id, action);
  return json({ ok: true });
}
