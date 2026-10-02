import type { D1Like } from "./db";

/**
 * 관리자 화면(/admin)에 보여 줄 값 (서버 전용).
 * 비밀번호 해시·소금·세션 토큰은 여기서 아예 읽지 않는다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** 가입자 수의 "오늘", "이번 주"와 화면의 날짜는 한국 시간(UTC+9) 기준 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export const MEMBER_LIST_LIMIT = 500;
export const REPORT_LIST_LIMIT = 300;

/** 한국 시간으로 오늘 0시 */
export function kstDayStart(now: number): number {
  return Math.floor((now + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS;
}

/** 한국 시간으로 이번 주 월요일 0시 */
export function kstWeekStart(now: number): number {
  const dayStart = kstDayStart(now);
  const weekday = new Date(dayStart + KST_OFFSET_MS).getUTCDay(); // 0 = 일요일
  return dayStart - ((weekday + 6) % 7) * DAY_MS;
}

/** "2026-10-02 14:05" (한국 시간) */
export function formatKst(at: number): string {
  return new Date(at + KST_OFFSET_MS).toISOString().slice(0, 16).replace("T", " ");
}

export interface AdminMember {
  username: string;
  nickname: string;
  createdAt: number;
  lastSeenAt: number | null;
  /** 푼 문제 수 (계정에 저장된 풀이 기록의 문제 개수) */
  solved: number;
}

export interface AdminReport {
  id: string;
  certId: string;
  questionId: string;
  stem: string;
  reason: string;
  memo: string;
  createdAt: number;
  resolvedAt: number | null;
}

export interface AdminOverview {
  total: number;
  today: number;
  week: number;
  members: AdminMember[];
  reportTotal: number;
  reportOpen: number;
  reports: AdminReport[];
}

export async function getAdminOverview(db: D1Like, now = Date.now()): Promise<AdminOverview> {
  const counts = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(created_at >= ?), 0) AS today,
              COALESCE(SUM(created_at >= ?), 0) AS week
         FROM users`,
    )
    .bind(kstDayStart(now), kstWeekStart(now))
    .first<{ total: number; today: number; week: number }>();

  const members = await db
    .prepare(
      `SELECT u.username AS username, u.nickname AS nickname, u.created_at AS createdAt,
              u.last_seen_at AS lastSeenAt,
              CASE WHEN json_valid(d.value) THEN (SELECT COUNT(*) FROM json_each(d.value)) ELSE 0 END AS solved
         FROM users u
         LEFT JOIN user_data d ON d.user_id = u.id AND d.key = 'history'
        ORDER BY u.created_at DESC
        LIMIT ?`,
    )
    .bind(MEMBER_LIST_LIMIT)
    .all<AdminMember>();

  const reportCounts = await db
    .prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(resolved_at IS NULL), 0) AS open FROM reports`)
    .first<{ total: number; open: number }>();

  // 처리 전 신고를 먼저, 그 안에서는 최신순
  const reports = await db
    .prepare(
      `SELECT id, cert_id AS certId, question_id AS questionId, stem, reason, memo,
              created_at AS createdAt, resolved_at AS resolvedAt
         FROM reports
        ORDER BY (resolved_at IS NOT NULL), created_at DESC
        LIMIT ?`,
    )
    .bind(REPORT_LIST_LIMIT)
    .all<AdminReport>();

  return {
    total: counts?.total ?? 0,
    today: counts?.today ?? 0,
    week: counts?.week ?? 0,
    members: members.results,
    reportTotal: reportCounts?.total ?? 0,
    reportOpen: reportCounts?.open ?? 0,
    reports: reports.results,
  };
}
