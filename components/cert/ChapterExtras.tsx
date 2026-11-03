import Link from "next/link";
import { Stars } from "@/components/Stars";
import { fmt, getMessages, type Locale } from "@/lib/i18n";
import type { Question } from "@/lib/types";

/**
 * 단원 페이지에 공통으로 쓰는 상자들 (단원 핵심정리 페이지 · 합친 개념 정리 단원 페이지).
 */

/** 자주 틀리는 함정 (chapters.json 의 pitfalls). 이 단원 문제의 틀린 선지에서 뽑아 검증한 것 (docs/refine.md) */
export function ChapterPitfalls({
  locale,
  chapterName,
  pitfalls,
}: {
  locale: Locale;
  chapterName: string;
  pitfalls?: Array<{ trap: string; fact: string }>;
}) {
  if (!pitfalls || pitfalls.length === 0) return null;
  const m = getMessages(locale);
  return (
    <section aria-labelledby="pitfalls-title" className="card space-y-4 p-6">
      <h2 id="pitfalls-title" className="text-lg font-bold">
        {fmt(m.chapter.pitfallsTitle, { name: chapterName })}
      </h2>
      <ul className="space-y-4">
        {pitfalls.map((p) => (
          <li key={p.trap} className="space-y-1">
            <p>
              <span className="font-bold text-ink-sub">{m.chapter.pitfallTrap}: </span>
              {p.trap}
            </p>
            <p>
              <span className="font-bold text-accent">{m.chapter.pitfallFact}: </span>
              {p.fact}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 연도별 공개 기출 문항 수 (최근 연도가 앞). 수록한 기출을 세기만 한다 */
export function pastByYear(questions: Question[]): Array<[number, number]> {
  const counts = new Map<number, number>();
  for (const q of questions) if (q.source === "past" && q.pastInfo) counts.set(q.pastInfo.year, (counts.get(q.pastInfo.year) ?? 0) + 1);
  return [...counts].sort((a, b) => b[0] - a[0]);
}

/** 공개 기출 출제 기록 (지어낸 수치 없음. 내용 다듬기를 마친 자격증만 부르는 쪽에서 보여 준다) */
export function PastTrend({ locale, chapterName, questions }: { locale: Locale; chapterName: string; questions: Question[] }) {
  const years = pastByYear(questions);
  if (years.length === 0) return null;
  const m = getMessages(locale);
  const total = years.reduce((sum, [, n]) => sum + n, 0);
  return (
    <section aria-labelledby="past-trend-title" className="card space-y-2 p-6">
      <h2 id="past-trend-title" className="text-lg font-bold">
        {fmt(m.chapter.pastTrendTitle, { name: chapterName })}
      </h2>
      <p>{fmt(m.chapter.pastTrendText, { n: total })}</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {years.map(([year, n]) => (
          <li key={year} className="font-bold">
            {fmt(m.chapter.pastTrendYear, { year, n })}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 중요도·출제 비중 상자 */
export function ChapterWeight({
  locale,
  importance,
  subjectName,
  subjectTotal,
  examWeight,
}: {
  locale: Locale;
  importance: number;
  subjectName: string;
  subjectTotal: number;
  examWeight: number;
}) {
  const m = getMessages(locale);
  const expected = Math.max(1, Math.round((subjectTotal * examWeight) / 100));
  return (
    <dl className="card grid gap-x-4 gap-y-2 p-4 sm:grid-cols-[7rem_1fr] sm:p-4">
      <dt className="font-bold text-ink-sub">{m.common.importance}</dt>
      <dd>
        <Stars value={importance} /> <span className="font-bold">{fmt(m.chapter.importanceValue, { n: importance })}</span>
      </dd>
      <dt className="font-bold text-ink-sub">{m.chapter.weight}</dt>
      <dd className="font-bold">
        {fmt(m.chapter.weightValue, { subject: subjectName, total: subjectTotal, expected, weight: examWeight })}
      </dd>
    </dl>
  );
}

/** 이 단원 N문제 풀기 / 이 과목 5문제 풀기 */
export function ChapterSolve({
  locale,
  certPath,
  chapterId,
  chapterName,
  subjectId,
  subjectName,
  quizCount,
}: {
  locale: Locale;
  certPath: string;
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  quizCount: number;
}) {
  if (quizCount <= 0) return null;
  const m = getMessages(locale);
  return (
    <section aria-label={m.chapter.solveLabel} className="rounded-2xl bg-primary-soft p-4">
      <p className="font-bold">{m.chapter.solveHint}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Link href={`${certPath}/quiz?chapter=${chapterId}&count=${quizCount}`} className="btn btn-primary btn-lg">
          {fmt(m.chapter.solveN, { name: chapterName, n: quizCount })}
        </Link>
        <Link href={`${certPath}/quiz?level=basic&count=5&subject=${subjectId}`} className="btn btn-lg">
          {fmt(m.chapter.solveN, { name: subjectName, n: 5 })}
        </Link>
      </div>
    </section>
  );
}
