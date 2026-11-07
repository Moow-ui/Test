import { checkFeedback } from "@/lib/feedback-rules";
import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { createFeedback } from "@/lib/server/feedback";
import { clientIp } from "@/lib/server/reviews";

/** 개선 의견 보내기. 로그인 없이 보낼 수 있고, 공개되지 않는다 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const checked = checkFeedback(await request.json().catch(() => null));
  if ("error" in checked) return json({ error: checked.error }, 400);

  const result = await createFeedback(db, checked.data, { ip: clientIp(request.headers) });
  if ("error" in result) return json({ error: result.error }, 429);
  return json({ ok: true });
}
