import { checkCheer, type CheerItem } from "@/lib/cheer-rules";
import { isLocale } from "@/lib/i18n";
import { isSameOrigin, json } from "@/lib/server/auth";
import { createCheer, listPublicCheers } from "@/lib/server/cheers";
import { getDb } from "@/lib/server/db";
import { clientIp } from "@/lib/server/reviews";

/** 응원 페이지에 보여 줄 공개 응원 (관리자가 공개한 것만, 그 언어만) */
export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get("lang");
  if (!isLocale(locale)) return json({ error: "bad_request" }, 400);
  const db = await getDb();
  const cheers: CheerItem[] = db ? await listPublicCheers(db, locale) : [];
  return json({ cheers });
}

/** 응원 남기기. 로그인 없이 쓸 수 있고, 처음에는 비공개로 저장된다 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const raw: unknown = await request.json().catch(() => null);
  const checked = checkCheer(raw);
  if ("error" in checked) return json({ error: checked.error }, 400);

  const result = await createCheer(db, checked.data, { ip: clientIp(request.headers) });
  if ("error" in result) return json({ error: result.error }, 429);
  return json({ ok: true });
}
