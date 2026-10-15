import Link from "next/link";
import { QuestionImage } from "@/components/QuestionImage";
import { Stars } from "@/components/Stars";
import { fmt, getMessages, type Locale } from "@/lib/i18n";
import type { ConceptChapter } from "@/lib/types";

/**
 * 개념 정리 화면(/cert/{slug}/concepts, /cert/{slug}/concepts/{단원})의 공통 부품.
 * 서버 컴포넌트라 본문이 HTML 로 그대로 나간다. 상자 안에 상자를 넣지 않고 여백으로 나눈다.
 */

/** 작성 주체 안내: "AI 작성 · 검수 완료" + 한 줄 설명. 페이지 맨 아래 작은 회색 글씨로 둔다 */
export function ConceptByline({ locale, by }: { locale: Locale; by: "ai" | "staff" }) {
  const m = getMessages(locale).concepts;
  return (
    <p className="text-sm text-ink-sub">
      {by === "staff" ? m.byStaff : m.byAiVerified}
      {by === "ai" && <> · {m.byInfo}</>}
    </p>
  );
}

/** 핵심 개념 카드. compact 면 정의만 (자격증 개념 정리 전체 화면), 아니면 외우는 요령·출처까지 */
export function ConceptCards({
  locale,
  concepts,
  compact = false,
}: {
  locale: Locale;
  concepts: ConceptChapter["concepts"];
  compact?: boolean;
}) {
  const m = getMessages(locale).concepts;
  return (
    <ul className={`mt-4 grid gap-4 ${compact ? "sm:grid-cols-2" : ""}`}>
      {concepts.map((c) => (
        <li key={c.term} className="card p-6">
          <h3 className="text-lg font-bold">{c.term}</h3>
          <p className="mt-2">{c.definition}</p>
          {!compact && (
            <p className="mt-4">
              <span className="mr-2 rounded-full bg-primary-soft px-3 py-1 text-sm font-bold">{m.tip}</span>
              {c.tip}
            </p>
          )}
          {c.source && (
            <p className="mt-2 text-sm text-ink-sub">{fmt(m.sourceLine, { org: c.source.org, year: c.source.year })}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** 자주 나오는 포인트 */
export function ConceptPoints({ locale, points }: { locale: Locale; points: string[] }) {
  const m = getMessages(locale).concepts;
  return (
    <section aria-labelledby="points-title">
      <h2 id="points-title" className="text-lg font-bold">
        {m.points}
      </h2>
      <ul className="card mt-4 list-disc space-y-2 p-6 pl-10">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  );
}

/** 단원 그림 (있을 때만). 표지판·회로도처럼 그림으로 봐야 이해되는 단원 */
export function ConceptFigures({ locale, figures }: { locale: Locale; figures: NonNullable<ConceptChapter["figures"]> }) {
  const m = getMessages(locale).concepts;
  return (
    <section aria-labelledby="figures-title">
      <h2 id="figures-title" className="text-lg font-bold">
        {m.figures}
      </h2>
      <div className="card mt-4 space-y-4 p-4">
        {figures.map((fig) => (
          <QuestionImage key={fig.image} src={fig.src} alt={fig.alt} caption={fig.caption} />
        ))}
      </div>
    </section>
  );
}

/** 헷갈리는 것 비교표 (있을 때만). 좁은 화면에서는 표 안에서만 옆으로 밀린다 */
export function ConceptCompare({ locale, compare }: { locale: Locale; compare: NonNullable<ConceptChapter["compare"]> }) {
  const m = getMessages(locale).concepts;
  return (
    <section aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-lg font-bold">
        {m.compare}: {compare.title}
      </h2>
      <div className="card mt-4 overflow-x-auto p-2">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {compare.columns.map((col) => (
                <th key={col} scope="col" className="bg-surface-2 p-2 text-sm font-bold first:rounded-l-lg last:rounded-r-lg">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {compare.rows.map((row) => (
              <tr key={row.join("|")} className="border-b border-line-soft last:border-0">
                {row.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row" className="p-2 align-top font-bold">
                      {cell}
                    </th>
                  ) : (
                    <td key={i} className="p-2 align-top">
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * 요약 노트의 단원 한 칸 (개념 정리 전체 페이지, P16).
 * 번호 붙은 단원 제목(누르면 단원 페이지) → 개요(summary) → 핵심 정리(용어에 형광펜 + 뜻 한 줄) → ★ 시험 포인트 → 자세히 보기.
 */
export function ConceptNote({
  locale,
  id,
  number,
  name,
  href,
  importance,
  weight,
  entry,
}: {
  locale: Locale;
  id: string;
  number: string;
  name: string;
  href: string;
  importance: number;
  weight: number;
  entry: Pick<ConceptChapter, "summary" | "concepts" | "points" | "figures">;
}) {
  const m = getMessages(locale).concepts;
  return (
    <article id={id} aria-labelledby={`${id}-title`} className="scroll-mt-4 border-t border-card-line px-4 py-6 sm:px-6">
      <h4 id={`${id}-title`} className="text-lg font-bold leading-snug">
        <Link href={href} className="link">
          {number} {name}
        </Link>
      </h4>
      <p className="mt-1 text-sm text-ink-sub">
        <Stars value={importance} /> {fmt(m.weightEstimated, { n: weight })}
      </p>

      {entry.summary && entry.summary.length > 0 && (
        <div className="mt-4 space-y-2 border-l-4 border-primary pl-4">
          <p className="text-sm font-bold text-accent">{m.noteOverview}</p>
          {entry.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm font-bold text-accent">{m.noteKey}</p>
      <dl className="mt-2 space-y-2">
        {entry.concepts.map((c) => (
          <div key={c.term}>
            <dt className="inline font-bold">
              <mark className="rounded bg-primary-soft px-1 text-ink">{c.term}</mark>
            </dt>
            <dd className="inline"> — {c.definition}</dd>
          </div>
        ))}
      </dl>

      {entry.figures?.map((fig) => (
        <QuestionImage key={fig.image} src={fig.src} alt={fig.alt} caption={fig.caption} />
      ))}

      <p className="mt-6 text-sm font-bold text-accent">{m.notePoints}</p>
      <ul className="mt-2 list-disc space-y-1 pl-6">
        {entry.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <Link href={href} className="link mt-4 inline-flex min-h-11 items-center">
        {m.noteMore}
      </Link>
    </article>
  );
}
