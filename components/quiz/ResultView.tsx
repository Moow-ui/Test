"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { FoldMark } from "@/components/Fold";
import { Markdown } from "@/components/Markdown";
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

/** 결과 화면 맨 위: 왼쪽에 사이트 이름(누르면 메인으로). 풀이 중인 시험 화면에는 두지 않는다 */
export function ResultHeader() {
  const { locale, brand } = useMessages();
  return (
    <header className="no-print bg-header">
      <div className="mx-auto flex h-[56px] w-full max-w-5xl items-center px-3 sm:px-4">
        <Link href={localePath(locale)} className="text-[21px] font-extrabold tracking-tight text-white">
          {brand}
        </Link>
      </div>
    </header>
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
  /** 풀이 이름 (예: "초급 · 전체 과목", "실전 CBT 체험") */
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
        <p className="text-[0.9rem] font-bold text-ink-sub">
          {cert.name} · {label}
        </p>
        <h1 className="text-2xl font-extrabold">{m.title}</h1>
      </header>

      <section aria-label={m.scoreLabel} className="card p-4 sm:p-5">
        <p className="text-lg font-bold">{fmt(m.correctOf, { total: summary.total, correct: summary.correct })}</p>
        <p className="mt-1 text-4xl font-extrabold">{fmt(m.score, { n: formatScore(summary.score) })}</p>

        {verdict && (
          <div
            className={`mt-4 rounded-lg border-2 p-3 ${
              verdict.passed ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"
            }`}
          >
            <p className="text-lg font-extrabold">
              {m.verdict}{" "}
              <span className={verdict.passed ? "text-ok" : "text-bad"}>{verdict.passed ? m.pass : m.fail}</span>
            </p>
            <p className="mt-1 text-[0.95rem]">{fmt(m.criteria, { text: criteria.description })}</p>
            {verdict.failedSubjects.length > 0 && (
              <p className="mt-1 text-[0.95rem] font-bold">
                {fmt(m.failedSubjects, {
                  list: verdict.failedSubjects
                    .map((s) => fmt(m.failedItem, { name: s.name, score: formatScore(s.score) }))
                    .join(all.common.listSeparator),
                  min: verdict.subjectMinScore ?? 0,
                })}
              </p>
            )}
            {summary.total < RELIABLE_QUESTION_COUNT && <p className="mt-1 text-[0.9rem]">{m.fewQuestions}</p>}
          </div>
        )}
      </section>

      <section aria-labelledby="by-subject-title">
        <h2 id="by-subject-title" className="text-xl font-extrabold">
          {m.bySubject}
        </h2>
        <ul className="mt-2 space-y-2">
          {summary.bySubject.map((s) => {
            const failed = verdict?.failedSubjects.some((f) => f.id === s.id);
            return (
              <li key={s.id} className="card p-3">
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
                  className="mt-1.5 h-4 overflow-hidden rounded border border-line bg-surface-2"
                >
                  <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {wrong.length > 0 && (
        <section aria-labelledby="concepts-title" className="rounded-xl border-2 border-primary bg-primary-soft p-4">
          <h2 id="concepts-title" className="text-xl font-extrabold">
            {m.concepts}
            <span className="ml-2 text-[0.95rem] font-bold">{m.conceptsHint}</span>
          </h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-6">
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
        <h2 id="weak-title" className="text-xl font-extrabold">
          {m.weak}
        </h2>
        {summary.weakChapters.length === 0 ? (
          <p className="card mt-2 p-3 font-bold">{m.noWrong}</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {summary.weakChapters.map((c, i) => (
              <li key={c.id} className="card flex flex-wrap items-center justify-between gap-2 p-3">
                <span>
                  <span className="font-extrabold">{i + 1}. {c.name}</span>
                  <span className="ml-2 text-[0.9rem] font-bold text-ink-sub">
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
      </section>

      <section aria-labelledby="review-title" className="cv">
        <h2 id="review-title" className="text-xl font-extrabold">
          {m.review}
        </h2>
        <ol className="mt-2 space-y-2">
          {questions.map((q, i) => {
            const g = graded[i];
            return (
              <li key={q.id}>
                <details className="card">
                  <summary className="flex min-h-14 items-center gap-2 p-3">
                    <span className={`shrink-0 font-extrabold ${g.correct ? "text-ok" : "text-bad"}`}>
                      {g.correct ? m.ok : m.ng}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap font-bold">
                      {i + 1}. {q.stem}
                    </span>
                    <span className="shrink-0 text-[0.9rem] font-bold text-accent">
                      <FoldMark />
                    </span>
                  </summary>
                  <div className="space-y-2 border-t border-line-soft p-3">
                    <ol className="space-y-1">
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
                    <div className="rounded-lg border border-line-soft p-3">
                      <Markdown text={q.explanation} />
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      <AdSlot position="result-bottom" />
    </div>
  );
}
