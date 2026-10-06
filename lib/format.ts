import { fmt, type Messages } from "./i18n";
import type { Question } from "./types";

/** 선지 번호 표시. 선지는 최대 MAX_CHOICES(6)개까지 있을 수 있다 (lib/schemas.ts) */
export const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥"] as const;

/** 선지 번호(1~6) → ①~⑥ */
export function circled(n: number): string {
  return CIRCLED[n - 1] ?? String(n);
}

/** 문제 출처 배지 문구: "2025년 제36회 기출"(실제 회차 명칭), 명칭이 없으면 "2023년 1회 기출", 또는 "예상문제" */
export function sourceLabel(q: Pick<Question, "source" | "pastInfo">, m: Messages): string {
  if (q.source === "past" && q.pastInfo) {
    const { year, round, roundName } = q.pastInfo;
    return roundName ? fmt(m.source.pastNamed, { year, roundName }) : fmt(m.source.past, { year, round });
  }
  return m.source.predicted;
}

/** 기출 출처·이용 조건 한 줄: "출처: (시행기관) 2025년 제36회 시험 · 이용 조건: 공공누리 제1유형". 예상문제는 null */
export function pastCredit(q: Pick<Question, "source" | "pastInfo">, m: Messages): string | null {
  if (q.source !== "past" || !q.pastInfo?.issuer || !q.pastInfo.license) return null;
  const { year, round, roundName, issuer, license } = q.pastInfo;
  return fmt(m.source.pastCredit, { issuer, year, roundName: roundName ?? fmt(m.source.roundFallback, { round }), license });
}

/** 날짜 → "2026.10.01" */
export function formatDate(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 초 → "59:07" */
export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 0~100 점수를 화면용 정수로 */
export function formatScore(score: number): string {
  return String(Math.round(score));
}
