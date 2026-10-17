import { Badge } from "@/components/Badge";
import { INSPECTED_AT } from "@/config/inspection";
import { fmt, getMessages, type Locale } from "@/lib/i18n";

/** 제목 아래 작은 초록 표시: "26년 10월 17일 검사 완료" (날짜는 config/inspection.ts) */
export function InspectedBadge({ lang }: { lang: Locale }) {
  const date = INSPECTED_AT[lang];
  const parts = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!parts) return null;
  const [, year, month, day] = parts;
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
