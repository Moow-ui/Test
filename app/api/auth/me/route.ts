import { destroySession, getSessionUser, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

const SEEN_INTERVAL_MS = 10 * 60 * 1000;

/** 지금 로그인한 사람. available=false 면 로그인 서버(DB)가 연결되지 않은 상태다 */
export async function GET() {
  const db = await getDb();
  if (!db) return json({ user: null, available: false });
  const user = await getSessionUser(db);
  if (user) {
    // 마지막 접속일 (관리자 화면용). 화면을 열 때마다 쓰지 않도록 10분에 한 번만 고친다
    const now = Date.now();
    await db
      .prepare("UPDATE users SET last_seen_at = ? WHERE id = ? AND (last_seen_at IS NULL OR last_seen_at < ?)")
      .bind(now, user.id, now - SEEN_INTERVAL_MS)
      .run();
  }
  return json({ user, available: true });
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
