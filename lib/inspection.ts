/** "검사 완료" 날짜 계산 (설정: config/inspection.ts) */

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국시간 기준 날짜 YYYY-MM-DD */
export function kstDate(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 빌드한 날부터 거꾸로, 검사하지 못한 날을 건너뛴 가장 최근 날짜 */
export function inspectedDate(buildDate: string, skipped: readonly string[]): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(buildDate)) return null;
  const skip = new Set(skipped);
  let t = Date.parse(`${buildDate}T00:00:00Z`);
  for (let i = 0; i < 366; i++, t -= DAY_MS) {
    const date = new Date(t).toISOString().slice(0, 10);
    if (!skip.has(date)) return date;
  }
  return null;
}
