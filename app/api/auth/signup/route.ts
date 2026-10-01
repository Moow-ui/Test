import { signupSchema } from "@/lib/auth-rules";
import { DB_MISSING_MESSAGE, createSession, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword, randomToken } from "@/lib/server/password";

/** 회원가입: 아이디·비밀번호·닉네임만 받는다 (이메일·전화번호 등 개인정보는 받지 않는다) */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "잘못된 요청입니다." }, 403);
  const db = await getDb();
  if (!db) return json({ error: DB_MISSING_MESSAGE }, 503);

  const parsed = signupSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  const { username, password, nickname } = parsed.data;

  const exists = await db.prepare("SELECT id FROM users WHERE username = ?").bind(username).first();
  if (exists) return json({ error: "이미 사용 중인 아이디입니다." }, 409);

  const id = randomToken(12);
  const { hash, salt } = await hashPassword(password);
  await db
    .prepare("INSERT INTO users (id, username, nickname, pw_hash, pw_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(id, username, nickname, hash, salt, Date.now())
    .run();
  await createSession(db, id, request);
  return json({ user: { id, username, nickname } });
}
