/**
 * 회장 검사 순서 진행 (새벽 루틴이 매일 맨 끝에 실행. docs/daily-routine.md 3-1).
 *   npm run inspection:next
 *
 * 1. 지난번에 알려 준 자격증을 그날 검사한 것으로 data/inspection.json 에 적는다 → 화면의 "검사 완료" 날짜가 바뀐다
 *    (그날이 config/inspection.ts 의 SKIPPED_DATES 에 있으면 적지 않는다)
 * 2. 오늘 검사할 자격증을 골라 (개수는 자격증 수에 따라 10·20·30·40개, lib/inspection.ts) 적고 화면에 출력한다 (새로 추가된 것 → 검사한 지 오래된 것 순)
 * 같은 날 다시 실행하면 파일을 바꾸지 않고 오늘 목록만 다시 보여 준다.
 */
import fs from "node:fs";
import path from "node:path";
import { INSPECTED_LOCALES, SKIPPED_DATES } from "../config/inspection";
import { getInspection, getReadyCertifications } from "../lib/data";
import { DATA_ROOT } from "../lib/data/fs-store";
import { INSPECTION_FILE } from "../lib/data/paths";
import { localeCountry } from "../lib/i18n";
import { advanceInspection, inspectionsPerDay, kstDate } from "../lib/inspection";

async function main(): Promise<void> {
  const today = kstDate(new Date());
  const countries = new Set(INSPECTED_LOCALES.map(localeCountry));
  const certs = (await getReadyCertifications()).filter((c) => countries.has(c.country));
  const before = await getInspection();
  const step = advanceInspection(before, certs.map((c) => c.id), today, SKIPPED_DATES);

  if (step.file !== before) {
    fs.writeFileSync(path.join(DATA_ROOT, INSPECTION_FILE), `${JSON.stringify(step.file, null, 2)}\n`);
  }

  const prev = before.today;
  if (step.skippedDate) console.log(`검사 못 한 날(${step.skippedDate}) → 그날 목록은 날짜를 바꾸지 않음`);
  else if (prev && step.recorded.length > 0) console.log(`${prev.date} 검사 완료로 적음: ${step.recorded.length}개`);

  const byId = new Map(certs.map((c) => [c.id, c]));
  const list = step.file.today?.certs ?? [];
  console.log(`\n오늘(${step.file.today?.date}) 검사할 자격증 ${list.length}개`);
  list.forEach((id, i) => {
    const cert = byId.get(id);
    const lang = INSPECTED_LOCALES.find((l) => localeCountry(l) === cert?.country) ?? "ko";
    const last = step.file.inspected[id];
    const note = last ? `마지막 검사 ${last}` : "첫 검사 (새 자격증)";
    console.log(`${i + 1}. ${cert?.name ?? id} — https://exampasso.com/${lang}/cert/${id} (${note})`);
  });
  const never = certs.filter((c) => !step.file.inspected[c.id]).length;
  console.log(`\n검사 대상 ${certs.length}개 · 하루 ${inspectionsPerDay(certs.length)}개 · 아직 검사 기록 없음 ${never}개`);
}

void main();
