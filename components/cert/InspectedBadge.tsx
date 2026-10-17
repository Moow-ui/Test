import { Badge } from "@/components/Badge";
import { INSPECTED_LOCALES, SKIPPED_DATES } from "@/config/inspection";
import { fmt, getMessages, type Locale } from "@/lib/i18n";
import { inspectedDate } from "@/lib/inspection";

/**
 * 제목 아래 작은 초록 표시: "26년 10월 17일 검사 완료".
 * 날짜 = 빌드한 날(한국시간, next.config.ts 의 INSPECTION_BUILD_DATE)에서 검사 못 한 날을 뺀 가장 최근 날 (config/inspection.ts)
 */
export function InspectedBadge({ lang }: { lang: Locale }) {
  if (!INSPECTED_LOCALES.includes(lang)) return null;
  const date = inspectedDate(process.env.INSPECTION_BUILD_DATE ?? "", SKIPPED_DATES);
  if (!date) return null;
  const [year, month, day] = date.split("-");
  const text = fmt(getMessages(lang).common.inspectedOn, {
    yy: year.slice(2),
    month: Number(month),
    day: Number(day),
  });
  return (
    <p className="mt-2">
      <Badge tone="ok">{text}</Badge>
    </p>
  );
}
