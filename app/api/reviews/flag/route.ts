import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { clientIp, flagReview } from "@/lib/server/reviews";

/** 후기 신고. 서로 다른 3곳에서 신고하면 자동으로 숨긴다 (같은 곳에서 여러 번 눌러도 1번) */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(body.id)) {
    return json({ error: "bad_request" }, 400);
  }
  const result = await flagReview(db, body.id, clientIp(request.headers));
  if (!result) return json({ error: "bad_request" }, 404);
  return json({ ok: true, hidden: result.hidden });
}
