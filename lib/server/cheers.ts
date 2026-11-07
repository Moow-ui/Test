import { CHEERS_PER_IP_PER_DAY, CHEER_PUBLIC_LIMIT, type CheerInput, type CheerItem } from "../cheer-rules";
import type { Locale } from "../i18n";
import { kstDayStart } from "./admin";
import type { D1Like } from "./db";
import { randomToken } from "./password";
import { ipHash } from "./reviews";

/**
 * 응원 한마디 (서버 전용). 자격증 후기(reviews.ts)와 따로 저장한다.
 * 새 응원은 비공개로 저장되고, 관리자 화면에서 [공개]를 누른 것만 응원 페이지에 보인다.
 * IP 원문은 저장하지 않는다. 날짜를 섞은 해시만 저장해 "하루 3개" 제한에만 쓴다.
 */

/** 응원을 비공개로 저장한다. 같은 IP 가 오늘 이미 3개를 남겼으면 "cheer_limit" */
export async function createCheer(
  db: D1Like,
  input: CheerInput,
  options: { ip: string; now?: number },
): Promise<{ ok: true } | { error: string }> {
  const now = options.now ?? Date.now();
  const dayStart = kstDayStart(now);
  const hash = await ipHash(options.ip, `cheer|${dayStart}`);
  const today = await db
    .prepare("SELECT COUNT(*) AS n FROM cheers WHERE ip_hash = ? AND created_at >= ?")
    .bind(hash, dayStart)
    .first<{ n: number }>();
  if ((today?.n ?? 0) >= CHEERS_PER_IP_PER_DAY) return { error: "cheer_limit" };

  await db
    .prepare(
      `INSERT INTO cheers (id, locale, body, nickname, ip_hash, created_at, public)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
    )
    .bind(randomToken(12), input.locale, input.body, input.nickname, hash, now)
    .run();
  return { ok: true };
}

/** 응원 페이지에 보여 줄 공개 응원 (그 언어만, 최신순) */
export async function listPublicCheers(db: D1Like, locale: Locale): Promise<CheerItem[]> {
  const rows = await db
    .prepare(
      `SELECT id, body, nickname, created_at AS createdAt
         FROM cheers
        WHERE locale = ? AND public = 1
        ORDER BY created_at DESC, id
        LIMIT ?`,
    )
    .bind(locale, CHEER_PUBLIC_LIMIT)
    .all<CheerItem>();
  return rows.results;
}

export const CHEER_ADMIN_ACTIONS = ["publish", "unpublish", "delete"] as const;
export type CheerAdminAction = (typeof CHEER_ADMIN_ACTIONS)[number];

/** 관리자: 공개 · 비공개 · 삭제. 내용은 고치지 않는다 */
export async function setCheerState(db: D1Like, id: string, action: CheerAdminAction): Promise<void> {
  if (action === "delete") {
    await db.prepare("DELETE FROM cheers WHERE id = ?").bind(id).run();
  } else {
    await db
      .prepare("UPDATE cheers SET public = ? WHERE id = ?")
      .bind(action === "publish" ? 1 : 0, id)
      .run();
  }
}

export const CHEER_LIST_LIMIT = 300;

export interface AdminCheer extends CheerItem {
  locale: string;
  public: number;
}

/** 관리자: 최신 응원 (비공개 포함)과 개수 */
export async function getAdminCheers(db: D1Like): Promise<{ total: number; publicTotal: number; cheers: AdminCheer[] }> {
  const counts = await db
    .prepare("SELECT COUNT(*) AS total, COALESCE(SUM(public = 1), 0) AS publicTotal FROM cheers")
    .first<{ total: number; publicTotal: number }>();
  const rows = await db
    .prepare(
      `SELECT id, locale, body, nickname, created_at AS createdAt, public
         FROM cheers
        ORDER BY created_at DESC
        LIMIT ?`,
    )
    .bind(CHEER_LIST_LIMIT)
    .all<AdminCheer>();
  return { total: counts?.total ?? 0, publicTotal: counts?.publicTotal ?? 0, cheers: rows.results };
}
