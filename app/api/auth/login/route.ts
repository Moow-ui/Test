import { LOCK_MINUTES, MAX_LOGIN_FAILS, loginSchema } from "@/lib/auth-rules";
import { DB_MISSING_MESSAGE, createSession, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/server/password";

const WRONG = "wrong_credentials";

interface UserRow {
  id: string;
  username: string;
  nickname: string;
  pw_hash: string;
  pw_salt: string;
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: DB_MISSING_MESSAGE }, 503);

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: WRONG }, 400);
  const { username, password } = parsed.data;
  const now = Date.now();

  // 비밀번호를 여러 번 틀리면 잠시 막는다 (무작위 대입 방지)
  const attempt = await db
    .prepare("SELECT fails, locked_until AS lockedUntil FROM login_attempts WHERE username = ?")
    .bind(username)
    .first<{ fails: number; lockedUntil: number }>();
  if (attempt && attempt.lockedUntil > now) {
    return json({ error: "locked" }, 429);
  }

  const user = await db
    .prepare("SELECT id, username, nickname, pw_hash, pw_salt FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();

  let ok = false;
  if (user) ok = await verifyPassword(password, user.pw_salt, user.pw_hash);
  // 없는 아이디여도 같은 시간이 걸리게 해서, 응답 속도로 아이디 존재 여부를 알 수 없게 한다
  else await hashPassword(password);

  if (!user || !ok) {
    const fails = (attempt ? attempt.fails : 0) + 1;
    const locked = fails >= MAX_LOGIN_FAILS;
    await db
      .prepare(
        `INSERT INTO login_attempts (username, fails, locked_until) VALUES (?, ?, ?)
         ON CONFLICT(username) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until`,
      )
      // 잠글 때는 횟수를 0 으로 되돌려, 잠금이 풀린 뒤 다시 처음부터 센다
      .bind(username, locked ? 0 : fails, locked ? now + LOCK_MINUTES * 60 * 1000 : 0)
      .run();
    return json({ error: WRONG }, 401);
  }

  await db.batch([
    db.prepare("DELETE FROM login_attempts WHERE username = ?").bind(username),
    db.prepare("UPDATE users SET last_seen_at = ? WHERE id = ?").bind(now, user.id),
  ]);
  await createSession(db, user.id, request);
  return json({ user: { id: user.id, username: user.username, nickname: user.nickname } });
}
