import { Badge } from "@/components/Badge";
import { fmt, getMessages, type Locale } from "@/lib/i18n";

/**
 * 제목 아래 작은 표시: "2026년 출제기준 반영".
 * 연도 = meta.json 의 basisYear (공식 출제기준·법령을 그해에 확인했을 때만 올린다). 없으면 추가한 해.
 * 매일 바뀌는 날짜가 아니라 내용이 기준으로 삼은 시험 연도를 보여 준다 (2026-11-03 결정).
 */
export function BasisBadge({ lang, year }: { lang: Locale; year: number | null }) {
  if (!year) return null;
  return (
    <p className="mt-2">
      <Badge tone="ok">{fmt(getMessages(lang).common.basisYear, { year })}</Badge>
    </p>
  );
}
