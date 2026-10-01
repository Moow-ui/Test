import { cookies } from "next/headers";
import type { AuthUser } from "../auth-rules";
import type { D1Like } from "./db";
import { randomToken, sha256 } from "./password";

/** 로그인 상태(세션) 관리 (서버 전용) */

export const SESSION_COOKIE = "qpass_session";
const SESSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const DB_MISSING_MESSAGE = "로그인 서버가 아직 연결되지 않았습니다. 잠시 후 다시 시도해 주세요.";

/** 응답은 항상 캐시하지 않는다 (사람마다 내용이 다르다) */
export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** 다른 사이트에서 몰래 보낸 요청(CSRF)을 막는다: 브라우저가 보낸 Origin 이 우리 주소와 같아야 한다 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host =
      request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isHttps(request: Request): boolean {
  return (request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol).startsWith("https");
}

export async function createSession(db: D1Like, userId: string, request: Request): Promise<void> {
  const token = randomToken(32);
  const expiresAt = Date.now() + SESSION_DAYS * DAY_MS;
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(await sha256(token), userId, expiresAt)
    .run();
  (await cookies()).set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true, // 화면의 스크립트가 읽을 수 없게
    sameSite: "lax",
    secure: isHttps(request),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSessionUser(db: D1Like): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT u.id AS id, u.username AS username, u.nickname AS nickname, s.expires_at AS expiresAt
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?`,
    )
    .bind(await sha256(token))
    .first<AuthUser & { expiresAt: number }>();
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    await destroySession(db);
    return null;
  }
  return { id: row.id, username: row.username, nickname: row.nickname };
}

export async function destroySession(db: D1Like | null): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token && db) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
  }
  store.delete(SESSION_COOKIE);
}
