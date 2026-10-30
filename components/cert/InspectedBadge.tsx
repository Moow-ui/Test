import { Badge } from "@/components/Badge";
import { INSPECTED_LOCALES } from "@/config/inspection";
import { getInspectedDate } from "@/lib/data";
import { fmt, getMessages, type Locale } from "@/lib/i18n";

/**
 * 제목 아래 작은 초록 표시: "26년 10월 17일 검사 완료".
 * 날짜 = 회장이 그 자격증을 마지막으로 검사한 날 (data/inspection.json, lib/inspection.ts). 기록이 없으면 표시하지 않는다.
 */
export async function InspectedBadge({ lang, certId }: { lang: Locale; certId: string }) {
  if (!INSPECTED_LOCALES.includes(lang)) return null;
  const date = await getInspectedDate(certId);
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
