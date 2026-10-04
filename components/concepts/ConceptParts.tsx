import { fmt, getMessages, type Locale } from "@/lib/i18n";
import type { Certification, ConceptChapter } from "@/lib/types";

/**
 * 개념 정리 화면(/cert/{slug}/concepts, /cert/{slug}/concepts/{단원})의 공통 부품.
 * 서버 컴포넌트라 본문이 HTML 로 그대로 나간다. 상자 안에 상자를 넣지 않고 여백으로 나눈다.
 */

/** 작성 주체 배지 + 한 줄 안내: "AI 작성 · 검수 완료" */
export function ConceptByline({ locale, by }: { locale: Locale; by: "ai" | "staff" }) {
  const m = getMessages(locale).concepts;
  return (
    <div className="space-y-2">
      <span className="inline-flex rounded-full bg-ok-soft px-3 py-1 text-sm font-bold text-ok">
        {by === "staff" ? m.byStaff : m.byAiVerified}
      </span>
      {by === "ai" && <p className="text-sm text-ink-sub">{m.byInfo}</p>}
    </div>
  );
}

/** 시험 방식 설명의 첫 마디만 ("객관식 4지 택일형, 컴퓨터로 보는 CBT 방식" → "객관식 4지 택일형") */
function shortFormat(format: string): string {
  return format.split(/[,.]/)[0].trim();
}

/** 한 줄 요약: 시험 형태 · 과목 수·문항 수 · 시간 / 합격 기준 / 출처(시행기관 · 확인 연도) */
export function ExamSummary({ locale, cert }: { locale: Locale; cert: Certification }) {
  const m = getMessages(locale).concepts;
  const info = cert.examInfo;
  if (!info) return null;
  const pass = info.passCriteria;
  const year = Number((cert.updatedAt ?? "").slice(0, 4)) || null;
  return (
    <section aria-label={m.summaryLabel} className="card space-y-2 p-6">
      <p className="text-lg font-bold">
        {fmt(m.summary, {
          format: shortFormat(info.format),
          subjects: cert.subjects.length,
          total: info.totalQuestions,
          minutes: info.timeLimitMinutes,
        })}
      </p>
      <p className="font-bold">
        {pass.subjectMinScore === null
          ? fmt(m.passAvg, { avg: pass.averageScore })
          : fmt(m.passWithMin, { avg: pass.averageScore, min: pass.subjectMinScore })}
      </p>
      {year && <p className="text-sm text-ink-sub">{fmt(m.sourceLine, { org: cert.issuer.name, year })}</p>}
    </section>
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
