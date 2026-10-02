import { getAdminIdentity } from "@/lib/server/access";
import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

const ACTIONS = ["hide", "show", "delete"] as const;
type Action = (typeof ACTIONS)[number];

/**
 * 후기 숨기기 / 다시 보이기 / 삭제 (관리자 전용).
 * Cloudflare Access 토큰이 없는 요청은 이런 주소가 없는 것처럼 404 로 답한다.
 */
export async function POST(request: Request) {
  if (!(await getAdminIdentity(request.headers))) return json({ error: "not_found" }, 404);
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const body = (await request.json().catch(() => null)) as { id?: unknown; action?: unknown } | null;
  const action = ACTIONS.find((a) => a === body?.action) as Action | undefined;
  if (typeof body?.id !== "string" || !action) return json({ error: "bad_request" }, 400);

  if (action === "hide") {
    await db.prepare("UPDATE reviews SET hidden = 1 WHERE id = ?").bind(body.id).run();
  } else if (action === "show") {
    // 다시 보이게 할 때는 쌓인 신고도 지운다 (그대로 두면 다음 신고 1번에 또 숨겨진다)
    await db.batch([
      db.prepare("DELETE FROM review_flags WHERE review_id = ?").bind(body.id),
      db.prepare("UPDATE reviews SET hidden = 0, report_count = 0 WHERE id = ?").bind(body.id),
    ]);
  } else {
    await db.batch([
      db.prepare("DELETE FROM review_flags WHERE review_id = ?").bind(body.id),
      db.prepare("DELETE FROM reviews WHERE id = ?").bind(body.id),
    ]);
  }
  return json({ ok: true });
}
