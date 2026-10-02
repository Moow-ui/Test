import { isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { addSolve, isKnownCert } from "@/lib/server/reviews";

const CERT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 문제 풀이를 끝낼 때마다 그 자격증의 이번 주 풀이 횟수를 1 올린다. 누가 풀었는지는 저장하지 않는다 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const body = (await request.json().catch(() => null)) as { certId?: unknown } | null;
  const certId = typeof body?.certId === "string" ? body.certId : "";
  if (!CERT_ID.test(certId) || certId.length > 80 || !(await isKnownCert(request, certId))) {
    return json({ error: "bad_request" }, 400);
  }
  await addSolve(db, certId);
  return json({ ok: true });
}
