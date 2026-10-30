/**
 * "검사 완료" 날짜와 회장 검사 순서 (기록: data/inspection.json, 설정: config/inspection.ts)
 *
 * 회장은 하루에 자격증 몇 개만 검사한다 (개수는 inspectionsPerDay: 자격증 수에 따라 10·20·30·40개). 새벽 루틴이 매일 `npm run inspection:next` 를 실행하면
 *   1. 어제 알려 준 자격증을 그날 검사한 것으로 적는다 (그날이 SKIPPED_DATES 에 있으면 적지 않는다 → 다시 차례가 온다)
 *   2. 오늘 검사할 자격증을 고른다: 한 번도 검사하지 않은 것(새로 추가된 것) → 검사한 지 오래된 것 → 자격증 id 순
 * 화면은 자격증마다 마지막으로 검사한 날만 보여 준다. 기록이 없는 자격증은 날짜를 표시하지 않는다.
 */
import type { z } from "zod";
import type { inspectionFileSchema } from "./schemas";

export type InspectionFile = z.infer<typeof inspectionFileSchema>;

/**
 * 회장이 하루에 검사하는 자격증 수. 검사 대상(한국·미국 합계) 자격증 수에 따라 늘어난다 (2026-10-30 회장 결정)
 *   100개 미만 10개 · 100개 이상 20개 · 150개 이상 30개 · 200개 이상 40개
 */
export function inspectionsPerDay(total: number): number {
  if (total >= 200) return 40;
  if (total >= 150) return 30;
  if (total >= 100) return 20;
  return 10;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한국시간 기준 날짜 YYYY-MM-DD */
export function kstDate(now: Date): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export interface InspectionStep {
  file: InspectionFile;
  /** 이번에 검사 날짜를 적은 자격증 */
  recorded: string[];
  /** 지난 목록의 날짜가 검사 못 한 날이라 적지 않은 경우 그 날짜 */
  skippedDate: string | null;
}

/**
 * 하루치 진행. 같은 날 다시 실행하면 아무것도 바꾸지 않는다.
 * certIds = 검사 대상(문제가 준비된 자격증). 목록에 없는 자격증의 기록은 지운다(이름이 바뀌거나 내려간 자격증).
 */
export function advanceInspection(
  file: InspectionFile,
  certIds: readonly string[],
  today: string,
  skipped: readonly string[],
  perDay = inspectionsPerDay(certIds.length),
): InspectionStep {
  if (file.today && file.today.date >= today) return { file, recorded: [], skippedDate: null };

  const known = new Set(certIds);
  const inspected: Record<string, string> = {};
  for (const [id, date] of Object.entries(file.inspected)) if (known.has(id)) inspected[id] = date;

  const recorded: string[] = [];
  let skippedDate: string | null = null;
  if (file.today) {
    if (skipped.includes(file.today.date)) skippedDate = file.today.date;
    else
      for (const id of file.today.certs) {
        if (!known.has(id)) continue;
        if (!inspected[id] || inspected[id] < file.today.date) inspected[id] = file.today.date;
        recorded.push(id);
      }
  }

  const next = [...certIds]
    .sort((a, b) => (inspected[a] ?? "").localeCompare(inspected[b] ?? "") || a.localeCompare(b))
    .slice(0, perDay);

  return { file: { inspected: sortKeys(inspected), today: { date: today, certs: next } }, recorded, skippedDate };
}

function sortKeys(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}
