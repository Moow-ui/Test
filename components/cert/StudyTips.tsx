import { FoldMark } from "@/components/Fold";
import { fmt, getMessages, type Locale } from "@/lib/i18n";
import type { StudyTips as StudyTipsData } from "@/lib/types";

/**
 * 운영진 학습 팁 상자 (후기란 바로 위). 이용자 후기와 섞이지 않게 따로 두고 "운영진 작성"이라고 표시한다.
 * 내용은 그 자격증의 meta.json(studyTips)에서 온다. 시험 정보처럼 접어 두고 눌러서 펼친다 (사용자 결정 2026-10-18).
 */
export function StudyTips({ locale, certName, tips }: { locale: Locale; certName: string; tips: StudyTipsData }) {
  const m = getMessages(locale).tips;
  const items = [
    { label: m.studyOrder, text: tips.studyOrder },
    { label: m.hardChapters, text: tips.hardChapters },
    { label: m.examDay, text: tips.examDay },
  ];
  return (
    <details aria-labelledby="tips-title" className="card">
      <summary className="flex min-h-14 items-center justify-between gap-2 px-4">
        <span className="flex flex-wrap items-center gap-2">
          <h2 id="tips-title" className="font-bold">
            {fmt(m.title, { name: certName })}
          </h2>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-ink-sub">{m.byStaff}</span>
        </span>
        <span className="shrink-0 text-sm font-bold text-accent">
          <FoldMark />
        </span>
      </summary>
      <dl className="space-y-4 px-4 pb-4">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="font-bold">{item.label}</dt>
            <dd className="mt-2 max-w-[68ch] text-sm">{item.text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
