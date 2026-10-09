import type { Country, Question } from "./types";

/**
 * 홈의 "오늘의 1문제" (P15).
 * 빌드 때 나라마다 DAILY_DAYS 일치 일정표를 만들어 두고(scripts/build-data.ts → /data/daily/{나라}.json),
 * 브라우저는 그 나라 날짜의 일 번호로 하루 한 문제를 고른다. 같은 날에는 누가 열어도 같은 문제다.
 * 문제는 검증을 통과한(검수 완료) 출제 중 문제만 쓰고, 자격증을 돌아가며 고르게 섞는다.
 */

/** 일정표 길이 (하루 1칸, 다 쓰면 처음부터 다시) */
export const DAILY_DAYS = 366;

/** 일정표의 한 칸: 문제가 들어 있는 단원 파일과 문제 id */
export interface DailyEntry {
  certId: string;
  certName: string;
  /** 원본 단원 파일 이름 (기록용. 브라우저는 자격증 문제 파일 하나를 받는다) */
  file: string;
  id: string;
}

/** 나라별 날짜 기준 시간대 */
const COUNTRY_TIME_ZONE: Record<Country, string> = {
  KR: "Asia/Seoul",
  US: "America/New_York",
};

/** 그 나라 날짜 (YYYY-MM-DD) */
export function dailyDateKey(country: Country, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: COUNTRY_TIME_ZONE[country],
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 날짜(YYYY-MM-DD)의 일 번호 (1970-01-01 = 0) */
export function dayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** 그 날의 칸 */
export function dailyEntryFor<T>(schedule: readonly T[], dateKey: string): T | null {
  if (schedule.length === 0) return null;
  return schedule[dayNumber(dateKey) % schedule.length];
}

/** 오늘의 1문제로 쓸 수 있는 문제: 검수 완료 예상문제(또는 기출) · 출제 중 · 그림 없음 */
export function isDailyCandidate(q: Question): boolean {
  if (q.retired || q.image) return false;
  if (q.source === "past") return !!q.pastInfo;
  return q.reviewStatus === "verified" && !!q.reviewedAt;
}

/** 무작위 대신 쓰는 고정 섞기 값 (빌드할 때마다 같은 결과) */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 일정표 만들기. 자격증을 id 순으로 돌아가며(k 번째 날 → k % 자격증 수), 그 자격증의 후보 중 하나를 고정 섞기로 고른다.
 * candidates 는 자격증별 후보 목록 (문제 id 순으로 정렬해서 넘긴다).
 */
export function buildDailySchedule(
  candidates: Array<{ certId: string; certName: string; items: Array<{ id: string; file: string }> }>,
  days = DAILY_DAYS,
): DailyEntry[] {
  const certs = candidates.filter((c) => c.items.length > 0).sort((a, b) => a.certId.localeCompare(b.certId));
  if (certs.length === 0) return [];
  return Array.from({ length: days }, (_, k) => {
    const cert = certs[k % certs.length];
    const item = cert.items[hash(`${cert.certId}:${k}`) % cert.items.length];
    return { certId: cert.certId, certName: cert.certName, file: item.file, id: item.id };
  });
}
