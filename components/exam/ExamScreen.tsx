"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { ReportForm } from "@/components/quiz/ReportForm";
import { Stars } from "@/components/Stars";
import { visibleChoices } from "@/lib/choices";
import { circled, formatClock, sourceLabel } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { calcStars, getPassContribution } from "@/lib/scoring";
import { EXAM_ZOOMS, STORAGE_KEYS, setExamZoom, type ExamZoom } from "@/lib/storage";
import type { Question, QuizLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { useStored } from "@/lib/use-storage";

export interface ExamScreenProps {
  certName: string;
  /** "초급 · 전체 과목", "실전 문제풀이" 등 */
  modeLabel: string;
  exitHref: string;
  questions: Question[];
  /**
   * 난이도 카드(초급 2개·중급 3개·고급 4개)로 풀 때의 난이도. 선지를 그 수만큼만 보여 준다 (lib/choices.ts).
   * 없으면 선지를 모두 보여 준다 (실전 문제풀이, 단원 풀기, 오답노트).
   */
  level?: QuizLevel | null;
  index: number;
  /** 문제 id → 고른 답 (원래 선지 번호. 화면에 보이는 번호와 다를 수 있다) */
  answers: Record<string, number>;
  /** "바로 답 확인하기"로 이미 채점해 보여 준 문제 */
  revealed: Record<string, boolean>;
  /** 제한 시간이 있는 시험(실전 문제풀이)만 넘긴다 */
  timer?: { remainingSec: number; totalSec: number };
  /** "바로 답 확인하기" 체크박스 (연습 풀이만). 없으면 체크박스를 그리지 않는다 */
  instant?: { checked: boolean; onChange: (checked: boolean) => void };
  /** 마지막에 누르는 버튼: grade = "채점하기"(연습 풀이), submit = "답안 제출"(실전 문제풀이) */
  submitKind: "grade" | "submit";
  onSelect: (question: Question, choice: number) => void;
  onGoTo: (index: number) => void;
  onSubmit: () => void;
  onPause?: () => void;
  metaOf: (question: Question) => { location: string; chapterImportance: number };
}

/**
 * 시험 화면 (연습 풀이·실전 문제풀이 공용).
 * 실제 CBT 시험 화면과 같은 배열을 따른다:
 *   위: 종목명 · 문제 수(또는 남은 시간) / 글자크기 100·150·200%
 *   가운데: 문제와 보기 ①~④ / 오른쪽: 답안 표기란
 *   아래: 이전 · 다음 · 안 푼 문제 · 답안 제출
 * 연습 풀이에서는 "바로 답 확인하기"를 켜 두면 보기를 고르는 즉시 채점 결과가 문제 아래에 나온다.
 *
 * 화면의 보기 번호는 보이는 순서대로 1, 2, 3… 이고, 답은 원래 선지 번호로 주고받는다.
 */
export function ExamScreen({
  certName,
  modeLabel,
  exitHref,
  questions,
  level,
  index,
  answers,
  revealed,
  timer,
  instant,
  submitKind,
  onSelect,
  onGoTo,
  onSubmit,
  onPause,
  metaOf,
}: ExamScreenProps) {
  const { m: all } = useMessages();
  const m = all.exam;
  const submitLabel = submitKind === "grade" ? m.grade : m.submit;
  const zoom = useStored<ExamZoom>(STORAGE_KEYS.examZoom, 100);
  const [showSheet, setShowSheet] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);

  const total = questions.length;
  const question = questions[index];
  /** 지금 문제에서 보여 줄 선지의 원래 번호. 화면의 n번 보기 = shown[n - 1] */
  const shown = visibleChoices(question, level);
  const chosen = answers[question.id];
  const isRevealed = !!revealed[question.id];
  const isLast = index + 1 >= total;
  const unanswered = questions.map((q, i) => ({ q, i })).filter(({ q }) => answers[q.id] === undefined);
  const fontPx = (EXAM_ZOOMS.find((z) => z.value === zoom) ?? EXAM_ZOOMS[0]).px;

  const goTo = (i: number) => {
    onGoTo(Math.max(0, Math.min(total - 1, i)));
    setShowUnanswered(false);
    setConfirming(false);
    window.scrollTo(0, 0);
  };

  const select = (choice: number) => {
    if (isRevealed) return;
    onSelect(question, choice);
    // 고른 뒤 Enter 로 바로 넘어갈 수 있게 "다음" 버튼에 초점을 둔다
    nextRef.current?.focus({ preventScroll: true });
  };

  /** 마지막 문제의 큰 버튼, 그리고 "답안 제출" 버튼 */
  const requestSubmit = () => {
    // 연습 풀이에서 다 풀었으면 바로 채점한다. 안 푼 문제가 있거나 실전 문제풀이 면 한 번 더 묻는다
    if (!timer && unanswered.length === 0) onSubmit();
    else setConfirming(true);
  };

  const forward = () => (isLast ? requestSubmit() : goTo(index + 1));

  // 확인창이 뜨면 초점을 창으로 옮긴다 (화면 읽기 프로그램이 읽어 주고, Tab 이 창 안의 버튼부터 시작한다)
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirming) dialogRef.current?.focus();
  }, [confirming]);

  // 키보드: 숫자 키로 답 표기, ←/→ 이전·다음, Enter 다음(마지막 문제에서는 채점)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 확인창이 떠 있는 동안에는 뒤의 시험 화면을 건드리지 않는다. Esc 는 "계속 풀기"
      if (confirming) {
        if (e.key === "Escape") setConfirming(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (tag === "INPUT" && (target as HTMLInputElement).type !== "checkbox");
      if (typing) return;
      if (/^[1-9]$/.test(e.key) && Number(e.key) <= shown.length) {
        e.preventDefault();
        select(shown[Number(e.key) - 1]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (!isLast) goTo(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === "Enter" && !e.repeat) {
        // 버튼·링크에 초점이 있으면 브라우저가 그 버튼을 누르므로 여기서는 처리하지 않는다
        if (tag === "BUTTON" || tag === "A" || tag === "INPUT") return;
        e.preventDefault();
        forward();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ───── 위: 종목명, 문제 수 / 남은 시간 ───── */}
      <header className="bg-[#1e3a8a] text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-3 py-2 text-[15px]">
          <h1 className="font-bold">
            {certName} <span className="font-normal">· {modeLabel}</span>
          </h1>
          {timer ? (
            <p>
              {fmt(m.timeLimit, { min: Math.round(timer.totalSec / 60) })}{" "}
              <span
                role="timer"
                className={`text-[18px] font-extrabold tabular-nums ${timer.remainingSec <= 300 ? "text-[#fca5a5]" : ""}`}
              >
                {formatClock(timer.remainingSec)}
              </span>
            </p>
          ) : (
            <p>{fmt(m.totals, { total, left: unanswered.length })}</p>
          )}
        </div>
      </header>

      {/* ───── 글자크기 · 나가기 ───── */}
      <div className="border-b border-line-soft bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-1.5 text-[13px] font-bold">
          <div role="group" aria-label={m.fontSizeLabel} className="flex items-center gap-1">
            <span>{m.fontSize}</span>
            {EXAM_ZOOMS.map((z) => (
              <button
                key={z.value}
                type="button"
                aria-pressed={zoom === z.value}
                onClick={() => setExamZoom(z.value)}
                className={`h-8 rounded border px-2 ${
                  zoom === z.value
                    ? "border-[#1e3a8a] bg-[#1e3a8a] text-white"
                    : "border-line bg-surface text-ink hover:border-ink"
                }`}
              >
                {z.value}%
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {timer && <span>{fmt(m.totalsShort, { total, left: unanswered.length })}</span>}
            {onPause && (
              <button type="button" className="underline underline-offset-2" onClick={onPause}>
                {m.pause}
              </button>
            )}
            <Link href={exitHref} className="underline underline-offset-2">
              {m.exit}
            </Link>
          </div>
        </div>
      </div>

      {/* ───── 문제 / 답안 표기란 ───── */}
      <div
        className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-3 px-3 py-3 lg:grid-cols-[1fr_15.5rem]"
        style={{ fontSize: `${fontPx}px` }}
      >
        <section aria-label={m.question} className="border border-line bg-surface px-[1em] py-[0.9em]">
          <p className="text-[12px] font-bold text-ink-sub">
            {sourceLabel(question, all)}
            {question.reviewStatus === "unverified" && ` · ${all.source.unverified}`}
          </p>
          <h2 className="mt-[0.2em] whitespace-pre-wrap font-bold leading-normal">
            {index + 1}. {question.stem}
          </h2>

          <ol className="mt-[0.5em]">
            {shown.map((original, i) => {
              const n = i + 1;
              const choice = question.choices[original - 1];
              const selected = chosen === original;
              const isAnswer = original === question.answer;
              let row = "hover:bg-surface-2";
              let bubble = "border-ink bg-surface text-ink";
              if (isRevealed && isAnswer) {
                row = "bg-ok-soft";
                bubble = "border-ok bg-ok text-surface";
              } else if (isRevealed && selected) {
                row = "bg-bad-soft";
                bubble = "border-bad bg-bad text-surface";
              } else if (selected) {
                row = "bg-primary-soft font-bold";
                bubble = "border-ink bg-ink text-surface";
              }
              return (
                <li key={n}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={isRevealed}
                    onClick={() => select(original)}
                    className={`flex min-h-[2.7em] w-full items-center gap-[0.6em] rounded px-[0.4em] py-[0.35em] text-left leading-snug ${row}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-[1.5em] w-[1.5em] shrink-0 items-center justify-center rounded-full border-2 text-[0.8em] font-bold ${bubble}`}
                    >
                      {n}
                    </span>
                    <span className="sr-only">{fmt(m.choiceN, { n })}</span>
                    <span className="min-w-0 flex-1">{choice}</span>
                    {isRevealed && isAnswer && (
                      <span className="shrink-0 text-[12px] font-extrabold text-ok">{all.common.answer}</span>
                    )}
                    {isRevealed && selected && !isAnswer && (
                      <span className="shrink-0 text-[12px] font-extrabold text-bad">{all.common.myChoice}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {isRevealed && (
            <AnswerResult
              key={question.id}
              question={question}
              answerNo={shown.indexOf(question.answer) + 1}
              chosen={chosen}
              meta={metaOf(question)}
            />
          )}
        </section>

        <aside
          aria-label={m.sheet}
          className={`border border-line bg-surface p-2 text-[14px] lg:block ${showSheet ? "" : "hidden"}`}
        >
          <h2 className="border-b border-line-soft pb-1 text-center font-extrabold">{m.sheet}</h2>
          <ol className="mt-1 grid grid-cols-2 gap-x-2 sm:grid-cols-3 lg:max-h-[calc(100dvh-14rem)] lg:grid-cols-1 lg:overflow-y-auto">
            {questions.map((q, i) => {
              const marked = answers[q.id];
              const graded = !!revealed[q.id];
              return (
                <li key={q.id} className={`flex items-center gap-1 rounded px-1 ${i === index ? "bg-primary-soft" : ""}`}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={fmt(marked === undefined ? m.goToUnanswered : m.goTo, { n: i + 1 })}
                    aria-current={i === index ? "true" : undefined}
                    className={`h-8 w-8 shrink-0 font-extrabold underline ${marked === undefined ? "text-bad" : "text-ink"}`}
                  >
                    {i + 1}
                  </button>
                  {visibleChoices(q, level).map((original, ci) => {
                    const n = ci + 1;
                    let bubble = "border-line bg-surface text-ink";
                    if (marked === original) {
                      bubble = !graded
                        ? "border-ink bg-ink text-surface"
                        : original === q.answer
                          ? "border-ok bg-ok text-surface"
                          : "border-bad bg-bad text-surface";
                    }
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={graded}
                        aria-label={fmt(m.mark, { q: i + 1, n })}
                        aria-pressed={marked === original}
                        onClick={() => onSelect(q, original)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[12px] font-bold ${bubble}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      {/* ───── 제출 확인: 아래 버튼 줄에 가리지 않도록 화면 가운데에 띄운다 ───── */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="submit-title"
            aria-describedby="submit-text"
            className="w-full max-w-md border-2 border-[#1e3a8a] bg-surface p-5 text-[17px] outline-none"
          >
            <h2 id="submit-title" className="text-[20px] font-extrabold">
              {unanswered.length === 0
                ? submitKind === "grade"
                  ? m.confirmGrade
                  : m.confirmSubmit
                : fmt(submitKind === "grade" ? m.unansweredGrade : m.unansweredSubmit, { n: unanswered.length })}
            </h2>
            <p id="submit-text" className="mt-2">
              {unanswered.length > 0 ? m.unansweredNote : m.allAnswered}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-primary btn-lg flex-1" onClick={onSubmit}>
                {submitKind === "grade" ? m.yesGrade : m.yesSubmit}
              </button>
              <button type="button" className="btn btn-lg flex-1" onClick={() => setConfirming(false)}>
                {m.noContinue}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── 아래: 바로 답 확인 · 이전 · 다음 · 안 푼 문제 · 제출 ───── */}
      <footer className="sticky bottom-0 border-t-2 border-line bg-surface">
        {/* 안 푼 문제 목록: 버튼 줄 바로 위에 붙여 항상 보이게 한다 */}
        {showUnanswered && (
          <div className="mx-auto max-h-[40dvh] w-full max-w-6xl overflow-y-auto border-b border-line px-3 py-2 text-[15px]">
            {unanswered.length === 0 ? (
              <p className="font-bold">{m.allAnswered}</p>
            ) : (
              <>
                <p className="font-bold">{fmt(m.unansweredList, { n: unanswered.length })}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {unanswered.map(({ q, i }) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        className="h-10 min-w-11 rounded border-2 border-line bg-surface px-2 font-bold hover:border-ink"
                        onClick={() => goTo(i)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 text-[15px] font-bold">
          <div className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              className="btn min-h-11 px-3 py-1"
            >
              {m.prev}
            </button>
            <button
              ref={nextRef}
              type="button"
              onClick={forward}
              className="btn btn-primary min-h-11 flex-1 px-4 py-1 sm:flex-none sm:min-w-36"
            >
              {isLast ? fmt(m.last, { label: submitLabel }) : m.next}
            </button>
            {instant && (
              <label className="flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={instant.checked}
                  onChange={(e) => instant.onChange(e.target.checked)}
                  className="h-5 w-5 accent-[#1e3a8a]"
                />
                {m.instant}
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={showSheet}
              onClick={() => setShowSheet((v) => !v)}
              className="btn min-h-11 px-3 py-1 lg:hidden"
            >
              {m.sheet}
            </button>
            <button
              type="button"
              aria-expanded={showUnanswered}
              onClick={() => setShowUnanswered((v) => !v)}
              className="btn min-h-11 px-3 py-1"
            >
              {fmt(m.unanswered, { n: unanswered.length })}
            </button>
            {!isLast && (
              <button type="button" onClick={requestSubmit} className="btn min-h-11 px-3 py-1">
                {submitLabel}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/** "바로 답 확인하기"로 채점한 결과. 해설과 오류 신고는 눌러야 펼쳐진다 */
function AnswerResult({
  question,
  answerNo,
  chosen,
  meta,
}: {
  question: Question;
  /** 화면에 보이는 정답 번호 (선지를 줄였으면 원래 번호와 다르다) */
  answerNo: number;
  chosen: number | undefined;
  meta: { location: string; chapterImportance: number };
}) {
  const { m: all } = useMessages();
  const m = all.exam;
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const correct = chosen === question.answer;
  const stars = calcStars(meta.chapterImportance, question.frequency);
  const contribution = getPassContribution({
    questionId: question.id,
    chapterImportance: meta.chapterImportance,
    frequency: question.frequency,
  });

  return (
    <div
      role="status"
      className={`mt-[0.7em] border-l-4 px-[0.8em] py-[0.5em] text-[0.85em] ${
        correct ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"
      }`}
    >
      <p className="font-extrabold">
        <span className={correct ? "text-ok" : "text-bad"}>{correct ? m.correct : m.wrong}</span>
        <span className="mx-1.5" aria-hidden="true">
          ·
        </span>
        {fmt(m.answerIs, { answer: circled(answerNo) })}
      </p>
      <p>
        <span className="font-bold">{all.common.keyConcept}</span> {question.oneLineConcept}
      </p>
      <p>
        {all.common.importance} <Stars value={stars} />
        <span className="mx-1.5" aria-hidden="true">
          ·
        </span>
        {m.passChance} <strong className="font-extrabold">{contribution.value}%</strong>
      </p>
      <button
        type="button"
        aria-expanded={showExplanation}
        onClick={() => setShowExplanation((v) => !v)}
        className="mt-1 font-bold underline underline-offset-2"
      >
        {showExplanation ? m.hideExplanation : m.showExplanation}
      </button>
      {showExplanation && (
        <div className="mt-2 border border-line bg-surface p-[0.8em]">
          <p className="mb-2 text-[12px] font-bold text-ink-sub">{meta.location}</p>
          <Markdown text={question.explanation} />
          <button
            type="button"
            className="mt-3 text-[12px] font-bold text-ink-sub underline underline-offset-2"
            aria-expanded={showReport}
            onClick={() => setShowReport((v) => !v)}
          >
            {m.report}
          </button>
          {showReport && <ReportForm question={question} onClose={() => setShowReport(false)} />}
        </div>
      )}
    </div>
  );
}
