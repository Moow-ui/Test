import { reportSchema } from "@/lib/report-rules";
import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { randomToken } from "@/lib/server/password";

/** 한 시간에 이보다 많이 들어오면 잠시 받지 않는다 (장난·도배 방지) */
const MAX_REPORTS_PER_HOUR = 200;
const HOUR_MS = 60 * 60 * 1000;

/** 문제 오류 신고 접수. 로그인 없이 보낼 수 있고, 누가 보냈는지는 저장하지 않는다 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { certId, questionId, stem, reason, memo } = parsed.data;
  const now = Date.now();

  const recent = await db
    .prepare("SELECT COUNT(*) AS n FROM reports WHERE created_at > ?")
    .bind(now - HOUR_MS)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= MAX_REPORTS_PER_HOUR) return json({ error: "too_many" }, 429);

  await db
    .prepare(
      `INSERT INTO reports (id, cert_id, question_id, stem, reason, memo, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    )
    .bind(randomToken(12), certId, questionId, stem, reason, memo, now)
    .run();
  return json({ ok: true });
}
