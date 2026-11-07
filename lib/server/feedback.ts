import { FEEDBACK_PER_IP_PER_DAY, type FeedbackInput } from "../feedback-rules";
import { kstDayStart } from "./admin";
import type { D1Like } from "./db";
import { randomToken } from "./password";
import { ipHash } from "./reviews";

/**
 * 개선 의견 (서버 전용). 공개하지 않고 관리자 화면에서만 읽는다.
 * IP 원문은 저장하지 않는다. 날짜를 섞은 해시만 저장해 "하루 5개" 제한에만 쓴다.
 */

/** 의견을 저장한다. 같은 IP 가 오늘 이미 5개를 보냈으면 "feedback_limit" */
export async function createFeedback(
  db: D1Like,
  input: FeedbackInput,
  options: { ip: string; now?: number },
): Promise<{ ok: true } | { error: string }> {
  const now = options.now ?? Date.now();
  const dayStart = kstDayStart(now);
  const hash = await ipHash(options.ip, `feedback|${dayStart}`);
  const today = await db
    .prepare("SELECT COUNT(*) AS n FROM feedback WHERE ip_hash = ? AND created_at >= ?")
    .bind(hash, dayStart)
    .first<{ n: number }>();
  if ((today?.n ?? 0) >= FEEDBACK_PER_IP_PER_DAY) return { error: "feedback_limit" };

  await db
    .prepare("INSERT INTO feedback (id, locale, body, ip_hash, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, NULL)")
    .bind(randomToken(12), input.locale, input.body, hash, now)
    .run();
  return { ok: true };
}

export const FEEDBACK_ADMIN_ACTIONS = ["done", "undo", "delete"] as const;
export type FeedbackAdminAction = (typeof FEEDBACK_ADMIN_ACTIONS)[number];

/** 관리자: 처리 완료 · 처리 전으로 · 삭제 */
export async function setFeedbackState(
  db: D1Like,
  id: string,
  action: FeedbackAdminAction,
  now = Date.now(),
): Promise<void> {
  if (action === "delete") {
    await db.prepare("DELETE FROM feedback WHERE id = ?").bind(id).run();
  } else {
    await db
      .prepare("UPDATE feedback SET resolved_at = ? WHERE id = ?")
      .bind(action === "done" ? now : null, id)
      .run();
  }
}

export const FEEDBACK_LIST_LIMIT = 300;

export interface AdminFeedback {
  id: string;
  locale: string;
  body: string;
  createdAt: number;
  resolvedAt: number | null;
}

/** 관리자: 처리 전 의견을 먼저, 그 안에서는 최신순 */
export async function getAdminFeedback(db: D1Like): Promise<{ total: number; open: number; items: AdminFeedback[] }> {
  const counts = await db
    .prepare("SELECT COUNT(*) AS total, COALESCE(SUM(resolved_at IS NULL), 0) AS open FROM feedback")
    .first<{ total: number; open: number }>();
  const rows = await db
    .prepare(
      `SELECT id, locale, body, created_at AS createdAt, resolved_at AS resolvedAt
         FROM feedback
        ORDER BY (resolved_at IS NOT NULL), created_at DESC
        LIMIT ?`,
    )
    .bind(FEEDBACK_LIST_LIMIT)
    .all<AdminFeedback>();
  return { total: counts?.total ?? 0, open: counts?.open ?? 0, items: rows.results };
}
