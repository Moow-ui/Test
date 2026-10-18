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

/**
 * 기출 출처·이용 조건 한 줄: "출처: (시행기관) 2025년 제36회 시험문제 부동산학개론 14번 · 이용 조건: 공공누리 제1유형".
 * withItem 이 false 면 문항 번호를 뺀다 (자격증 페이지처럼 시험 단위로 모아 보여 줄 때). 예상문제는 null
 */
export function pastCredit(q: Pick<Question, "source" | "pastInfo">, m: Messages, withItem = true): string | null {
  if (q.source !== "past" || !q.pastInfo?.issuer || !q.pastInfo.license) return null;
  const { year, round, roundName, item, issuer, license } = q.pastInfo;
  const vars = { issuer, year, roundName: roundName ?? fmt(m.source.roundFallback, { round }), license };
  return withItem && item ? fmt(m.source.pastCreditItem, { ...vars, item }) : fmt(m.source.pastCredit, vars);
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

/**
 * 문제 수를 어림해서 "100+" 처럼 보여 준다 (실제 값보다 크게 쓰지 않도록 항상 내림).
 * 100 이상은 50 단위(150+), 10~99 는 10 단위(90+), 10 미만은 그대로. step 을 주면 그 단위로 (홈 목록 총 문제 수는 100 단위).
 */
export function roundedCount(n: number, locale: "ko" | "en", step?: number): string {
  const unit = step && n >= step ? step : n >= 100 ? 50 : n >= 10 ? 10 : 1;
  const value = Math.floor(n / unit) * unit;
  const text = value.toLocaleString(locale === "ko" ? "ko-KR" : "en-US");
  return unit === 1 ? text : `${text}+`;
}

/**
 * 글 읽는 시간(분, 올림). 한국어는 띄어쓰기 뺀 500자, 영어는 220단어를 1분으로 친다.
 * 수험 정보 목록·글 머리의 "약 N분"에 쓴다.
 */
export function readingMinutes(texts: string[], locale: string): number {
  const all = texts.join("\n");
  const units = locale === "ko" ? all.replace(/\s/g, "").length / 500 : all.split(/\s+/).filter(Boolean).length / 220;
  return Math.max(1, Math.ceil(units));
}

/** 수험 정보 글 하나의 본문(첫 문단·소제목별 본문·자주 묻는 질문) */
export function guideTexts(guide: {
  intro: string;
  sections: Array<{ body: string }>;
  faq?: Array<{ question: string; answer: string }>;
}): string[] {
  return [guide.intro, ...guide.sections.map((s) => s.body), ...(guide.faq ?? []).flatMap((f) => [f.question, f.answer])];
}
