import { checkReview, type ReviewPage } from "@/lib/review-rules";
import { getSessionUser, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { clientIp, createReview, isKnownCert, listReviews, reviewStats, weekSolves } from "@/lib/server/reviews";

const CERT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 자격증의 후기 목록(최신순 10개씩)·후기 수·평균 별점·이번 주 풀이 횟수 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const certId = params.get("cert") ?? "";
  if (!CERT_ID.test(certId) || certId.length > 80) return json({ error: "bad_request" }, 400);
  const before = Number(params.get("before"));

  const db = await getDb();
  if (!db) {
    const empty: ReviewPage = { reviews: [], total: 0, average: null, hasMore: false, weekSolves: null };
    return json(empty);
  }
  const [page, stats, solves] = await Promise.all([
    listReviews(db, certId, Number.isFinite(before) && before > 0 ? before : null),
    reviewStats(db, certId),
    weekSolves(db, certId),
  ]);
  const body: ReviewPage = { ...page, ...stats, weekSolves: solves };
  return json(body);
}

/** 후기 작성. 로그인 없이 쓸 수 있고, 로그인한 사람은 계정의 닉네임으로 등록된다 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const db = await getDb();
  if (!db) return json({ error: "db_missing" }, 503);

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw || typeof raw !== "object") return json({ error: "bad_request" }, 400);
  const user = await getSessionUser(db);
  const checked = checkReview({ ...raw, nickname: user ? user.nickname : raw.nickname });
  if ("error" in checked) return json({ error: checked.error }, 400);
  if (!(await isKnownCert(request, checked.data.certId))) return json({ error: "bad_request" }, 400);

  const ip = clientIp(request.headers);
  const result = await createReview(db, checked.data, { ip, userId: user?.id ?? null });
  if ("error" in result) return json({ error: result.error }, 429);
  return json({ ok: true, review: result.review });
}
