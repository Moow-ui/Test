import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PUBLIC_CERT_IDS_PATH, publicDataUrl } from "../data/paths";
import {
  ACTIVITY_MIN_TO_SHOW,
  REVIEWS_PER_IP_PER_DAY,
  REVIEW_AVERAGE_MIN,
  REVIEW_FLAGS_TO_HIDE,
  REVIEW_PAGE_SIZE,
  type ReviewInput,
  type ReviewItem,
} from "../review-rules";
import { kstDayStart, kstWeekStart } from "./admin";
import type { D1Like } from "./db";
import { randomToken, sha256 } from "./password";

/**
 * 자격증 후기·주간 풀이 횟수 (서버 전용).
 *
 * 스팸 방지: 같은 IP 하루 3개 + 링크·전화번호·금칙어 거부(lib/review-rules.ts) + 신고 3회 자동 숨김.
 * IP 원문은 저장하지 않는다. 날짜(또는 후기 id)를 섞은 해시만 저장한다.
 * Worker 변수 REVIEW_HASH_SALT 를 넣으면 그 값을 해시에 섞는다 (없어도 동작한다).
 */

async function readEnv(): Promise<Record<string, unknown>> {
  try {
    return (await getCloudflareContext({ async: true })).env as unknown as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** 요청을 보낸 IP (Cloudflare 가 붙여 준다). 저장하지 않고 해시의 재료로만 쓴다 */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  );
}

/**
 * IP 를 그대로 저장하지 않기 위한 해시. scope 를 섞어서 범위 밖에서는 같은 사람인지 알 수 없게 한다
 * (후기는 날짜, 신고는 후기 id).
 */
async function ipHash(ip: string, scope: string): Promise<string> {
  const salt = (await readEnv()).REVIEW_HASH_SALT ?? process.env.REVIEW_HASH_SALT;
  return sha256(`${typeof salt === "string" && salt ? salt : "qpass"}|${ip}|${scope}`);
}

// ───────────────────────── 자격증 id 확인 ─────────────────────────

let knownCertIds: Set<string> | null = null;

/**
 * 실제로 있는 자격증인가. 목록은 빌드 때 만든 정적 파일(/data/cert-ids.json)에서 읽는다.
 * 목록을 읽지 못하면 막지 않는다 (id 모양은 입력 규칙이 이미 검사했다).
 */
export async function isKnownCert(request: Request, certId: string): Promise<boolean> {
  if (!knownCertIds) {
    const url = new URL(publicDataUrl(PUBLIC_CERT_IDS_PATH), request.url);
    const assets = (await readEnv()).ASSETS as { fetch(input: string): Promise<Response> } | undefined;
    const sources = [
      () => (assets ? assets.fetch(url.toString()) : null),
      // 개발 서버에는 정적 파일 바인딩이 없어 같은 서버의 주소로 직접 읽는다
      () => (process.env.NODE_ENV === "development" ? fetch(url) : null),
    ];
    for (const load of sources) {
      try {
        const response = await load();
        if (!response?.ok) continue;
        const ids: unknown = await response.json();
        if (Array.isArray(ids)) {
          knownCertIds = new Set(ids.filter((id): id is string => typeof id === "string"));
          break;
        }
      } catch {
        // 다음 방법으로
      }
    }
  }
  return knownCertIds ? knownCertIds.has(certId) : true;
}

// ───────────────────────── 후기 ─────────────────────────

/** 자격증의 후기 한 쪽 (최신순). before 는 앞쪽에서 마지막으로 받은 후기의 작성 시각 */
export async function listReviews(
  db: D1Like,
  certId: string,
  before: number | null,
): Promise<{ reviews: ReviewItem[]; hasMore: boolean }> {
  const rows = await db
    .prepare(
      `SELECT id, rating, body, status, nickname, created_at AS createdAt
         FROM reviews
        WHERE cert_id = ? AND hidden = 0 AND created_at < ?
        ORDER BY created_at DESC, id
        LIMIT ?`,
    )
    .bind(certId, before ?? Number.MAX_SAFE_INTEGER, REVIEW_PAGE_SIZE + 1)
    .all<ReviewItem>();
  return { reviews: rows.results.slice(0, REVIEW_PAGE_SIZE), hasMore: rows.results.length > REVIEW_PAGE_SIZE };
}

/** 보이는 후기 수와 평균 별점. 평균은 후기가 5개 이상일 때만 돌려준다 */
export async function reviewStats(db: D1Like, certId: string): Promise<{ total: number; average: number | null }> {
  const row = await db
    .prepare("SELECT COUNT(*) AS total, AVG(rating) AS average FROM reviews WHERE cert_id = ? AND hidden = 0")
    .bind(certId)
    .first<{ total: number; average: number | null }>();
  const total = row?.total ?? 0;
  const average = total >= REVIEW_AVERAGE_MIN && row?.average != null ? Math.round(row.average * 10) / 10 : null;
  return { total, average };
}

/** 후기를 저장한다. 같은 IP 가 오늘 이미 3개를 썼으면 "review_limit" */
export async function createReview(
  db: D1Like,
  input: ReviewInput,
  options: { ip: string; userId: string | null; now?: number },
): Promise<{ review: ReviewItem } | { error: string }> {
  const now = options.now ?? Date.now();
  const dayStart = kstDayStart(now);
  const hash = await ipHash(options.ip, `review|${dayStart}`);
  const today = await db
    .prepare("SELECT COUNT(*) AS n FROM reviews WHERE ip_hash = ? AND created_at >= ?")
    .bind(hash, dayStart)
    .first<{ n: number }>();
  if ((today?.n ?? 0) >= REVIEWS_PER_IP_PER_DAY) return { error: "review_limit" };

  const review: ReviewItem = {
    id: randomToken(12),
    rating: input.rating,
    body: input.body,
    status: input.status,
    nickname: input.nickname,
    createdAt: now,
  };
  await db
    .prepare(
      `INSERT INTO reviews (id, cert_id, rating, body, status, nickname, user_id, ip_hash, created_at, hidden, report_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    )
    .bind(review.id, input.certId, review.rating, review.body, review.status, review.nickname, options.userId, hash, now)
    .run();
  return { review };
}

/** 후기 신고. 서로 다른 3곳에서 신고하면 자동으로 숨긴다. 없는 후기면 null */
export async function flagReview(db: D1Like, id: string, ip: string, now = Date.now()): Promise<{ hidden: boolean } | null> {
  const exists = await db.prepare("SELECT hidden FROM reviews WHERE id = ?").bind(id).first<{ hidden: number }>();
  if (!exists) return null;
  await db
    .prepare("INSERT OR IGNORE INTO review_flags (review_id, ip_hash, created_at) VALUES (?, ?, ?)")
    .bind(id, await ipHash(ip, `flag|${id}`), now)
    .run();
  const flags = await db
    .prepare("SELECT COUNT(*) AS n FROM review_flags WHERE review_id = ?")
    .bind(id)
    .first<{ n: number }>();
  const count = flags?.n ?? 0;
  const hide = count >= REVIEW_FLAGS_TO_HIDE;
  await db
    .prepare("UPDATE reviews SET report_count = ?, hidden = CASE WHEN hidden = 0 AND ? THEN 2 ELSE hidden END WHERE id = ?")
    .bind(count, hide ? 1 : 0, id)
    .run();
  return { hidden: hide || exists.hidden !== 0 };
}

// ───────────────────────── 주간 풀이 횟수 ─────────────────────────

/** 풀이 1회를 더한다 (자격증·주 단위의 숫자만. 누가 풀었는지는 남기지 않는다) */
export async function addSolve(db: D1Like, certId: string, now = Date.now()): Promise<void> {
  await db
    .prepare(
      `INSERT INTO quiz_activity (cert_id, week_start, count) VALUES (?, ?, 1)
       ON CONFLICT (cert_id, week_start) DO UPDATE SET count = count + 1`,
    )
    .bind(certId, kstWeekStart(now))
    .run();
}

/** 이번 주(한국 시간 월요일 0시부터) 풀이 횟수. 20회 미만이면 null (화면에 보여 주지 않는다) */
export async function weekSolves(db: D1Like, certId: string, now = Date.now()): Promise<number | null> {
  const row = await db
    .prepare("SELECT count FROM quiz_activity WHERE cert_id = ? AND week_start = ?")
    .bind(certId, kstWeekStart(now))
    .first<{ count: number }>();
  const count = row?.count ?? 0;
  return count >= ACTIVITY_MIN_TO_SHOW ? count : null;
}
