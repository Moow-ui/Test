import type { Level, Question } from "./types";

export const CIRCLED = ["①", "②", "③", "④"] as const;

/** 정답 번호(1~4) → ①~④ */
export function circled(n: number): string {
  return CIRCLED[n - 1] ?? String(n);
}

export const LEVEL_LABEL: Record<Level, string> = {
  basic: "초급",
  intermediate: "중급",
  advanced: "고급",
};

/** 문제 출처 배지 문구: "2023년 1회 기출" 또는 "AI 예상문제" */
export function sourceLabel(q: Pick<Question, "source" | "pastInfo">): string {
  if (q.source === "past" && q.pastInfo) {
    return `${q.pastInfo.year}년 ${q.pastInfo.round}회 기출`;
  }
  return "AI 예상문제";
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
