"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { FoldMark } from "@/components/Fold";
import { TopBar } from "@/components/TopBar";
import { ChapterNotesLink } from "@/components/quiz/ChapterNotesLink";
import { Markdown } from "@/components/Markdown";
import { REVIEWS_ANCHOR } from "@/components/reviews/ReviewSection";
import { visibleChoices } from "@/lib/choices";
import { circled, formatScore } from "@/lib/format";
import { gradeQuiz, summarize } from "@/lib/grading";
import { fmt, localePath } from "@/lib/i18n";
import { startSession } from "@/lib/storage";
import type { Question, QuizLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import type { QuizCert } from "./QuizRunner";

/** 이 문항 수보다 적게 풀었으면 합격 판정은 "참고용"이라고 알려 준다 */
const RELIABLE_QUESTION_COUNT = 20;

/** 결과 화면 맨 위: 다른 화면과 같은 상단 막대 (왼쪽 사이트 이름 → 메인, 오른쪽 글자 크기·어둡게). 풀이 중인 시험 화면에는 사이트 이름을 두지 않는다 */
export function ResultHeader() {
  const { locale, brand } = useMessages();
  return (
    <TopBar>
      <Link href={localePath(locale)} className="text-[22px] font-bold tracking-tight text-accent">
        {brand}
      </Link>
    </TopBar>
  );
}

/** 결과 화면: 점수, 과목별 정답률, 합격 기준 대비 판정, 약점 단원, 다시 풀기·오답노트 */
export function ResultView({
  cert,
  label,
  answers,
  questions,
  level,
  againAction,
}: {
  cert: QuizCert;
  /** 풀이 이름 (예: "초급 · 전체 과목", "실전 문제풀이") */
  label: string;
  /** 문제 id → 고른 답 */
  answers: Record<string, number>;
  questions: Question[];
  /** 난이도 카드로 푼 풀이면 그 난이도. 풀 때 보여 준 선지만 다시 보여 준다 (lib/choices.ts) */
  level?: QuizLevel | null;
  /** "새 문제로 다시 풀기" 자리에 들어갈 버튼/링크 */
  againAction: ReactNode;
}) {
  const router = useRouter();
  const { locale, m: all } = useMessages();
  const m = all.result;
  const certPath = localePath(locale, `/cert/${cert.id}`);

  const graded = gradeQuiz(questions, answers);
  const summary = summarize(graded, cert);
  const verdict = summary.verdict;
  const wrong = graded.filter((g) => !g.correct);
  // 오답노트에는 채점하는 순간 "답을 골라서 틀린 문제"만 자동으로 담긴다 (lib/storage.ts 의 addWrongNotes)
  const savedCount = wrong.filter((w) => w.chosen !== null).length;
  const criteria = cert.examInfo.passCriteria;
  /** 합격선 괄호 안 짧은 문구: meta.json 의 shortLabel(예: "2종 보통 60점"), 없으면 "평균 60점 · 과목별 40점" */
  const passLine =
    criteria.shortLabel ??
    (criteria.subjectMinScore === null
      ? fmt(m.lineAverage, { avg: criteria.averageScore })
      : fmt(m.lineWithMin, { avg: criteria.averageScore, min: criteria.subjectMinScore }));

  const retryWrong = () => {
    startSession({
      certId: cert.id,
      mode: "retry",
      label: m.retryLabel,
      level: null,
      subjectId: null,
      questionIds: wrong.map((w) => w.questionId),
    });
    window.scrollTo(0, 0);
    router.push(`${certPath}/quiz`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-bold text-ink-sub">
          {cert.name} · {label}
        </p>
        <h1 className="text-xl font-bold">{m.title}</h1>
      </header>

      {/* 점수: 큰 숫자 "60점" + 작게 "3/5 정답", 그 아래 합격선 한 줄. 긴 합격 기준은 ⓘ 를 눌러야 보인다 */}
      <section aria-label={m.scoreLabel} className="card p-6">
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <span className="text-2xl font-bold">{fmt(m.score, { n: formatScore(summary.score) })}</span>
          <span className="text-lg">{fmt(m.correctShort, { total: summary.total, correct: summary.correct })}</span>
        </p>

        {verdict && (
          <details className="mt-4">
            <summary className="flex min-h-11 items-center gap-2">
              <span className={`min-w-0 text-lg font-bold ${verdict.passed ? "text-ok" : "text-bad"}`}>
                {verdict.passed ? m.pass : m.fail} ({passLine})
              </span>
              <span
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[20px] leading-none text-ink-sub hover:bg-surface-2"
                title={m.criteriaButton}
              >
                <span aria-hidden="true">ⓘ</span>
                <span className="sr-only">{m.criteriaButton}</span>
              </span>
            </summary>
            <p className="mt-2 text-sm">{fmt(m.criteria, { text: criteria.description })}</p>
          </details>
        )}
        {verdict && verdict.failedSubjects.length > 0 && (
          <p className="mt-2 font-bold text-bad">
            {fmt(m.failedSubjects, {
              list: verdict.failedSubjects
                .map((s) => fmt(m.failedItem, { name: s.name, score: formatScore(s.score) }))
                .join(all.common.listSeparator),
              min: verdict.subjectMinScore ?? 0,
            })}
          </p>
        )}
        {verdict && summary.total < RELIABLE_QUESTION_COUNT && <p className="mt-2 text-sm text-ink-sub">{m.fewQuestions}</p>}
      </section>

      <section aria-labelledby="by-subject-title">
        <h2 id="by-subject-title" className="text-xl font-bold">
          {m.bySubject}
        </h2>
        <ul className="mt-2 space-y-2">
          {summary.bySubject.map((s) => {
            const failed = verdict?.failedSubjects.some((f) => f.id === s.id);
            return (
              <li key={s.id} className="card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{s.name}</span>
                  <span className="font-bold">
                    {fmt(m.subjectScore, { correct: s.correct, total: s.total, score: formatScore(s.score) })}
                    {failed && <span className="ml-2 text-bad">{m.failedTag}</span>}
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={fmt(m.subjectAria, { name: s.name, score: formatScore(s.score) })}
                  className="mt-2 h-3 overflow-hidden rounded-full bg-surface-2"
                >
                  <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {wrong.length > 0 && (
        <section aria-labelledby="concepts-title" className="rounded-2xl bg-primary-soft p-6">
          <h2 id="concepts-title" className="text-xl font-bold">
            {m.concepts}
          </h2>
          <p className="mt-2 text-sm">{m.conceptsHint}</p>
          <ol className="mt-2 list-decimal space-y-2 pl-6">
            {questions
              .filter((q, i) => !graded[i].correct)
              .map((q) => (
                <li key={q.id} className="font-bold">
                  {q.oneLineConcept}
                </li>
              ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="weak-title">
        <h2 id="weak-title" className="text-xl font-bold">
          {m.weak}
        </h2>
        {summary.weakChapters.length === 0 ? (
          <p className="card mt-2 p-4 font-bold">{m.noWrong}</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {summary.weakChapters.map((c, i) => (
              <li key={c.id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
                <span>
                  <span className="font-bold">{i + 1}. {c.name}</span>
                  <span className="ml-2 text-sm font-bold text-ink-sub">
                    {fmt(m.chapterScore, { total: c.total, correct: c.correct, score: formatScore(c.score) })}
                  </span>
                </span>
                <Link href={`${certPath}/${c.id}`} className="link">
                  {m.viewSummary}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label={m.next} className="grid gap-2 sm:grid-cols-2">
        {wrong.length > 0 && (
          <button type="button" className="btn btn-primary btn-lg" onClick={retryWrong}>
            {fmt(m.retryWrong, { n: wrong.length })}
          </button>
        )}
        {savedCount > 0 && (
          <Link href={`${certPath}/notes`} className="btn btn-lg">
            {fmt(m.saved, { n: savedCount })}
          </Link>
        )}
        {againAction}
        <Link href={certPath} className="btn btn-lg">
          {fmt(m.toCert, { name: cert.name })}
        </Link>
        <Link href={`${certPath}#${REVIEWS_ANCHOR}`} className="btn btn-lg">
          {m.writeReview}
        </Link>
      </section>

      <section aria-labelledby="review-title" className="cv">
        <h2 id="review-title" className="text-xl font-bold">
          {m.review}
        </h2>
        <ol className="mt-2 space-y-2">
          {questions.map((q, i) => {
            const g = graded[i];
            return (
              <li key={q.id}>
                <details className="card">
                  <summary className="flex min-h-14 items-center gap-2 p-4">
                    <span className={`shrink-0 font-bold ${g.correct ? "text-ok" : "text-bad"}`}>
                      {g.correct ? m.ok : m.ng}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap font-bold">
                      {i + 1}. {q.stem}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-accent">
                      <FoldMark />
                    </span>
                  </summary>
                  <div className="space-y-2 px-4 pb-4">
                    <ol className="space-y-2">
                      {visibleChoices(q, level).map((original, ci) => (
                        <li key={original} className={original === q.answer ? "font-bold" : ""}>
                          {circled(ci + 1)} {q.choices[original - 1]}
                          {original === q.answer && <span className="ml-2 text-ok">{m.answerMark}</span>}
                          {original === g.chosen && original !== q.answer && (
                            <span className="ml-2 font-bold text-bad">{m.myChoiceMark}</span>
                          )}
                        </li>
                      ))}
                    </ol>
                    <p>
                      <span className="font-bold">{all.common.keyConcept}</span> {q.oneLineConcept}
                    </p>
                    <Markdown text={q.explanation} />
                    {!g.correct && <ChapterNotesLink certId={cert.id} subjects={cert.subjects} question={q} />}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 시험 화면에는 하단 안내(Footer)가 없어서 약관 링크를 여기에 둔다 */}
      <nav aria-label={all.nav.legalMenu} className="no-print flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        {(["terms", "privacy", "disclaimer"] as const).map((id) => (
          <Link key={id} href={localePath(locale, `/${id}`)} className="link">
            {all.nav[id]}
          </Link>
        ))}
      </nav>

      <AdSlot position="result-bottom" />
    </div>
  );
}
