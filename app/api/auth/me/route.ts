import { destroySession, getSessionUser, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

/** 지금 로그인한 사람. available=false 면 로그인 서버(DB)가 연결되지 않은 상태다 */
export async function GET() {
  const db = await getDb();
  if (!db) return json({ user: null, available: false });
  return json({ user: await getSessionUser(db), available: true });
}

/** 회원 탈퇴: 계정과 저장된 기록을 모두 지운다 */
export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);
  const user = await getSessionUser(db);
  if (!user) return json({ error: "login_required" }, 401);

  await db.batch([
    db.prepare("DELETE FROM user_data WHERE user_id = ?").bind(user.id),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
    db.prepare("DELETE FROM login_attempts WHERE username = ?").bind(user.username),
    db.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
  ]);
  await destroySession(null);
  return json({ ok: true });
}
