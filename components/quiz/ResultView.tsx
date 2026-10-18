"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { FoldMark } from "@/components/Fold";
import { LogoMark } from "@/components/LogoMark";
import { SideMenu } from "@/components/SideMenu";
import { TopBar } from "@/components/TopBar";
import { ChapterNotesLink } from "@/components/quiz/ChapterNotesLink";
import { Markdown } from "@/components/Markdown";
import { QuestionImage } from "@/components/QuestionImage";
import { REVIEWS_ANCHOR } from "@/components/reviews/ReviewSection";
import { visibleChoices } from "@/lib/choices";
import { circled, formatScore } from "@/lib/format";
import { gradeQuiz, summarize } from "@/lib/grading";
import { fmt, localePath } from "@/lib/i18n";
import { startSession } from "@/lib/storage";
import type { Question, QuizLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import type { QuizCert } from "./QuizRunner";
import { ScoreRing } from "./ScoreRing";

/** 이 문항 수보다 적게 풀었으면 합격·불합격 판정을 하지 않는다 (사용자 결정 2026-10-18: 5문제 연습에 "합격선 미달"은 기운 빠진다) */
const RELIABLE_QUESTION_COUNT = 20;

/**
 * 결과 화면 맨 위: 다른 화면과 같은 상단 막대 (왼쪽 메뉴 버튼·사이트 이름 → 메인, 오른쪽 글자 크기·어둡게).
 * 휴대폰에서는 일반 화면처럼 "어둡게"를 메뉴 안으로 옮긴다. 풀이 중인 시험 화면에는 메뉴·사이트 이름을 두지 않는다
 */
export function ResultHeader() {
  const { locale, brand } = useMessages();
  return (
    <TopBar themeInMenu>
      <SideMenu />
      <Link
        href={localePath(locale)}
        className="inline-flex min-h-11 items-center gap-2 text-[18px] font-bold tracking-tight text-accent sm:text-[22px]"
      >
        <LogoMark size={28} />
        {brand}
      </Link>
    </TopBar>
  );
}

/**
 * 결과 화면 순서 (사용자 결정 2026-10-18): 점수(원형 게이지 + 바로 할 일 버튼 2개) → 문제별 결과 → 과목별(과목 2개 이상) → 다시 볼 것 → 그 밖의 링크.
 */
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
  // 문항 수가 적은 연습이면 판정을 숨긴다 (합격 기준 안내 한 줄만)
  const verdict = summary.total >= RELIABLE_QUESTION_COUNT ? summary.verdict : null;
  const wrong = graded.filter((g) => !g.correct);
  const skippedCount = wrong.filter((w) => w.chosen === null).length;
  // "다시 볼 것": 틀린 문제의 핵심 개념을 단원별로 묶는다 (많이 틀린 단원 → 중요한 단원 순)
  const reviewGroups = (() => {
    const groups = new Map<string, { id: string; name: string; importance: number; concepts: string[] }>();
    questions.forEach((q, i) => {
      if (graded[i].correct) return;
      const chapter = cert.subjects.find((s) => s.id === q.subjectId)?.chapters.find((c) => c.id === q.chapterId);
      const key = chapter?.id ?? q.chapterId;
      const group = groups.get(key) ?? {
        id: key,
        name: chapter?.name ?? "",
        importance: chapter?.importance ?? 0,
        concepts: [],
      };
      group.concepts.push(q.oneLineConcept);
      groups.set(key, group);
    });
    return [...groups.values()].sort((a, b) => b.concepts.length - a.concepts.length || b.importance - a.importance);
  })();
  // 과목별 정답률은 과목이 둘 이상일 때만 (하나면 위의 점수와 같다)
  const showSubjects = summary.bySubject.length > 1;
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

      {/* 점수: 원형 게이지(가운데 "60점 · 3/5") + 오른쪽에 맞음·틀림·안 푼 문제, 합격 판정(문항이 충분할 때만) */}
      <section aria-label={m.scoreLabel} className="card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing
            score={summary.score}
            tone={verdict ? (verdict.passed ? "ok" : "bad") : "primary"}
            marker={verdict ? criteria.averageScore : undefined}
            label={fmt(m.ringAria, { n: formatScore(summary.score), total: summary.total, correct: summary.correct })}
          >
            <span className="text-2xl font-bold">{fmt(m.score, { n: formatScore(summary.score) })}</span>
            <span className="text-sm text-ink-sub">
              {fmt(m.correctShort, { total: summary.total, correct: summary.correct })}
            </span>
          </ScoreRing>

          <div className="w-full min-w-0 space-y-2 text-center sm:text-left">
            <p className="text-lg font-bold">
              {fmt(m.breakdown, { ok: summary.correct, ng: wrong.length - skippedCount })}
              {skippedCount > 0 && <span className="text-ink-sub">{fmt(m.breakdownSkip, { n: skippedCount })}</span>}
            </p>

            {verdict ? (
              <>
                <details>
                  <summary className="flex min-h-11 items-center justify-center gap-2 sm:justify-start">
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
                {verdict.failedSubjects.length > 0 && (
                  <p className="font-bold text-bad">
                    {fmt(m.failedSubjects, {
                      list: verdict.failedSubjects
                        .map((s) => fmt(m.failedItem, { name: s.name, score: formatScore(s.score) }))
                        .join(all.common.listSeparator),
                      min: verdict.subjectMinScore ?? 0,
                    })}
                  </p>
                )}
                <p className="text-sm text-ink-sub">{fmt(m.markerNote, { line: passLine })}</p>
              </>
            ) : (
              <p className="text-sm text-ink-sub">
                {fmt(m.practiceNote, { n: summary.total })} {fmt(m.passInfo, { line: passLine })}
              </p>
            )}
          </div>
        </div>

        {/* 바로 할 일 큰 버튼 2개: 틀린 문제 다시 풀기(주황) · 새 문제로 다시 풀기. 나머지는 맨 아래 작은 링크 */}
        <div className={`mt-6 grid gap-2 ${wrong.length > 0 ? "sm:grid-cols-2" : ""}`}>
          {wrong.length > 0 && (
            <button type="button" className="btn btn-primary btn-lg" onClick={retryWrong}>
              {fmt(m.retryWrong, { n: wrong.length })}
            </button>
          )}
          {againAction}
        </div>
      </section>

      <section aria-labelledby="review-title" className="cv">
        <h2 id="review-title" className="text-lg font-bold">
          {m.review}
        </h2>
        <ol className="card mt-2 divide-y divide-line-soft overflow-hidden">
          {questions.map((q, i) => {
            const g = graded[i];
            return (
              <li key={q.id}>
                <details>
                  <summary className="flex min-h-14 items-center gap-3 p-4 hover:bg-primary-soft">
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                        g.correct
                          ? "bg-ok-soft text-ok"
                          : g.chosen === null
                            ? "bg-surface-2 text-ink-sub"
                            : "bg-bad-soft text-bad"
                      }`}
                    >
                      {g.correct ? m.ok : g.chosen === null ? m.skipped : m.ng}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap font-bold leading-snug">
                      {i + 1}. {q.stem}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-accent">
                      <FoldMark />
                    </span>
                  </summary>
                  <div className="space-y-2 px-4 pb-4">
                    {q.imageSrc && <QuestionImage src={q.imageSrc} alt={q.imageAlt ?? ""} />}
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

      {/* 과목별: 과목마다 작은 원형 게이지 (과목이 둘 이상일 때만). 과락이면 빨간 고리 + "과락" */}
      {showSubjects && (
        <section aria-labelledby="by-subject-title" className="card p-6">
          <h2 id="by-subject-title" className="text-lg font-bold">
            {m.bySubject}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {summary.bySubject.map((s) => {
              const failed = verdict?.failedSubjects.some((f) => f.id === s.id);
              return (
                <li key={s.id} className="flex flex-col items-center gap-2 text-center">
                  <ScoreRing
                    score={s.score}
                    size={96}
                    stroke={10}
                    tone={failed ? "bad" : "primary"}
                    label={fmt(m.subjectAria, { name: s.name, score: formatScore(s.score) })}
                  >
                    <span className="text-lg font-bold">{formatScore(s.score)}%</span>
                  </ScoreRing>
                  <span className="text-sm font-bold leading-snug">{s.name}</span>
                  <span className="text-sm text-ink-sub">
                    {fmt(m.correctShort, { total: s.total, correct: s.correct })}
                    {failed && <span className="ml-2 font-bold text-bad">{m.failedTag}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 다시 볼 것: 틀린 핵심 개념(단원별 묶음) + 그 단원 핵심정리 링크. 예전 "틀린 핵심 개념"·"약한 단원" 두 칸을 합친 것 */}
      <section aria-labelledby="to-review-title" className="card border-l-[6px] border-l-primary p-6">
        <h2 id="to-review-title" className="text-lg font-bold">
          {m.toReview}
        </h2>
        {reviewGroups.length === 0 ? (
          <p className="mt-2 font-bold">{m.noWrong}</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink-sub">{m.toReviewHint}</p>
            <ul className="mt-4 divide-y divide-line-soft">
              {reviewGroups.map((g) => (
                <li key={g.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-bold">
                      {g.name}
                      <span className="ml-2 text-sm font-normal text-ink-sub">
                        {fmt(m.chapterWrong, { n: g.concepts.length })}
                      </span>
                    </span>
                    <Link href={`${certPath}/${g.id}`} className="link text-sm">
                      {m.viewSummary}
                    </Link>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {g.concepts.map((c, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden="true" className="text-accent">
                          •
                        </span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* 그 밖에 할 일: 작은 링크 한 줄 (오답노트 · 자격증 페이지 · 후기) */}
      <nav
        aria-label={m.next}
        className="card flex flex-wrap items-center justify-center gap-x-6 gap-y-2 p-4 font-bold"
      >
        {savedCount > 0 && (
          <Link href={`${certPath}/notes`} className="link-quiet inline-flex min-h-11 items-center">
            {fmt(m.saved, { n: savedCount })}
          </Link>
        )}
        <Link href={certPath} className="link-quiet inline-flex min-h-11 items-center">
          {fmt(m.toCert, { name: cert.name })}
        </Link>
        <Link href={`${certPath}#${REVIEWS_ANCHOR}`} className="link-quiet inline-flex min-h-11 items-center">
          {m.writeReview}
        </Link>
      </nav>

      {/* 시험 화면에는 하단 안내(Footer)가 없어서 약관 링크를 여기에 둔다 */}
      <nav
        aria-label={all.nav.legalMenu}
        className="no-print flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-ink-sub"
      >
        {(["terms", "privacy", "disclaimer"] as const).map((id) => (
          <Link key={id} href={localePath(locale, `/${id}`)} className="link-quiet">
            {all.nav[id]}
          </Link>
        ))}
      </nav>

      <AdSlot position="result-bottom" />
    </div>
  );
}
