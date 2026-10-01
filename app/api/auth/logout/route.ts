import { destroySession, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "잘못된 요청입니다." }, 403);
  await destroySession(await getDb());
  return json({ ok: true });
}
