"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { ChapterNotesLink } from "@/components/quiz/ChapterNotesLink";
import { isReviewed } from "@/components/quiz/QuestionBadges";
import { ReportForm } from "@/components/quiz/ReportForm";
import { Stars } from "@/components/Stars";
import { visibleChoices } from "@/lib/choices";
import { circled, formatClock, pastCredit, sourceLabel } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { calcStars, getPassContribution } from "@/lib/scoring";
import type { Question, QuizLevel, Subject } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { TopBar } from "@/components/TopBar";

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
  /** 틀린 문제의 해설 아래에 "이 단원 핵심정리 보기" 링크를 걸 때 넘긴다 (연습 풀이) */
  chapterNotes?: { certId: string; subjects: Subject[] };
}

/**
 * 문제 위의 출처 배지 1개: "예상문제 · 검수 완료" + 오른쪽 ⓘ 버튼, 또는 "예상문제 · 검수 전", 또는 "2025년 제36회 기출" + 아래에 출처·이용 조건 한 줄.
 * ⓘ 를 누르면 검수 방식 안내가 펼쳐진다.
 * 문제 영역(<section key={문제 id}>) 안에 하나만 그린다. 문제가 바뀌면 영역째 새로 그려져 이전 배지가 남지 않는다.
 */
export function ReviewLine({ question }: { question: Question }) {
  const { m } = useMessages();
  const [open, setOpen] = useState(false);
  const reviewed = isReviewed(question);
  const status = reviewed ? m.source.reviewed : question.reviewStatus === "unverified" ? m.source.unverified : null;
  const credit = pastCredit(question, m);
  return (
    <div data-review-badge="">
      <p className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold ${
            reviewed ? "bg-ok-soft text-ok" : "bg-surface-2 text-ink-sub"
          }`}
        >
          {status ? `${sourceLabel(question, m)} · ${status}` : sourceLabel(question, m)}
        </span>
        {reviewed && (
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-lg leading-none text-ink-sub hover:bg-surface-2"
            aria-label={m.source.reviewInfoButton}
            title={m.source.reviewInfoButton}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
        )}
      </p>
      {open && <p className="mt-2 rounded-lg bg-surface-2 px-4 py-2 text-sm text-ink">{m.source.reviewInfo}</p>}
      {credit && <p className="mt-1 text-sm text-ink-sub">{credit}</p>}
    </div>
  );
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
  chapterNotes,
}: ExamScreenProps) {
  const { m: all } = useMessages();
  const m = all.exam;
  const submitLabel = submitKind === "grade" ? m.grade : m.submit;
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
      {/* ───── 위: 다른 화면과 같은 상단 막대 (왼쪽 나가기, 오른쪽 글자 크기·어둡게) ───── */}
      <TopBar wide>
        <Link href={exitHref} className="font-bold text-ink underline underline-offset-4">
          {m.exit}
        </Link>
        {onPause && (
          <button type="button" className="min-h-11 font-bold text-ink underline underline-offset-4" onClick={onPause}>
            {m.pause}
          </button>
        )}
      </TopBar>

      {/* ───── 한 줄 요약: "운전면허 학과시험 · 중급 · 3/5" (실전 문제풀이는 오른쪽에 남은 시간) ───── */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-4">
        <h1 className="text-base font-bold">
          {certName} · {modeLabel} · {fmt(m.progress, { n: index + 1, total })}
        </h1>
        {timer && (
          <p className="text-sm">
            {fmt(m.timeLimit, { min: Math.round(timer.totalSec / 60) })}{" "}
            <span
              role="timer"
              className={`text-lg font-bold tabular-nums ${timer.remainingSec <= 300 ? "text-bad" : ""}`}
            >
              {formatClock(timer.remainingSec)}
            </span>
          </p>
        )}
      </div>

      {/* ───── 문제 / 답안 표기란 ───── */}
      <div className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-4 px-4 py-4 text-base lg:grid-cols-[1fr_16rem]">
        {/* key: 문제가 바뀌면 문제 영역(배지·해설 포함)을 통째로 새로 그린다. 안쪽 요소에 같은 key 를 다시 쓰지 않는다 */}
        <section key={question.id} aria-label={m.question} className="card p-4 sm:p-6">
          <ReviewLine question={question} />
          <h2 className="mt-2 whitespace-pre-wrap font-bold leading-normal">
            {index + 1}. {question.stem}
          </h2>

          <ol className="mt-4 space-y-2">
            {shown.map((original, i) => {
              const n = i + 1;
              const choice = question.choices[original - 1];
              const selected = chosen === original;
              const isAnswer = original === question.answer;
              let row = "bg-bg hover:bg-primary-soft";
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
                    className={`flex min-h-12 w-full items-center gap-4 rounded-lg px-4 py-2 text-left leading-snug ${row}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${bubble}`}
                    >
                      {n}
                    </span>
                    <span className="sr-only">{fmt(m.choiceN, { n })}</span>
                    <span className="min-w-0 flex-1">{choice}</span>
                    {isRevealed && isAnswer && (
                      <span className="shrink-0 text-sm font-bold text-ok">{all.common.answer}</span>
                    )}
                    {isRevealed && selected && !isAnswer && (
                      <span className="shrink-0 text-sm font-bold text-bad">{all.common.myChoice}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {isRevealed && (
            <AnswerResult
              question={question}
              answerNo={shown.indexOf(question.answer) + 1}
              chosen={chosen}
              meta={metaOf(question)}
              chapterNotes={chapterNotes}
            />
          )}
        </section>

        <aside
          aria-label={m.sheet}
          className={`card p-4 text-sm lg:block ${showSheet ? "" : "hidden"}`}
        >
          <h2 className="text-center font-bold">{m.sheet}</h2>
          <ol className="mt-2 grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:max-h-[calc(100dvh-14rem)] lg:grid-cols-1 lg:overflow-y-auto">
            {questions.map((q, i) => {
              const marked = answers[q.id];
              const graded = !!revealed[q.id];
              return (
                <li key={q.id} className={`flex items-center rounded-lg ${i === index ? "bg-primary-soft" : ""}`}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={fmt(marked === undefined ? m.goToUnanswered : m.goTo, { n: i + 1 })}
                    aria-current={i === index ? "true" : undefined}
                    className={`h-11 w-11 shrink-0 font-bold underline ${marked === undefined ? "text-bad" : "text-ink"}`}
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
                        className="flex h-11 w-11 items-center justify-center"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${bubble}`}
                        >
                          {n}
                        </span>
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
            className="w-full max-w-md card p-6 text-base outline-none"
          >
            <h2 id="submit-title" className="text-lg font-bold">
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
      <footer className="sticky bottom-0 border-t border-line-soft bg-surface">
        {/* 안 푼 문제 목록: 버튼 줄 바로 위에 붙여 항상 보이게 한다 */}
        {showUnanswered && (
          <div className="mx-auto max-h-[40dvh] w-full max-w-6xl overflow-y-auto px-4 py-2 text-sm">
            {unanswered.length === 0 ? (
              <p className="font-bold">{m.allAnswered}</p>
            ) : (
              <>
                <p className="font-bold">{fmt(m.unansweredList, { n: unanswered.length })}</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {unanswered.map(({ q, i }) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        className="btn min-w-12 px-2"
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
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 text-sm font-bold">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
              className="btn"
            >
              {m.prev}
            </button>
            <button
              ref={nextRef}
              type="button"
              onClick={forward}
              className="btn btn-primary flex-1 sm:min-w-40 sm:flex-none"
            >
              {isLast ? fmt(m.last, { label: submitLabel }) : m.next}
            </button>
            {instant && (
              <label className="flex min-h-12 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={instant.checked}
                  onChange={(e) => instant.onChange(e.target.checked)}
                  className="h-6 w-6 accent-primary"
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
              className="btn lg:hidden"
            >
              {m.sheet}
            </button>
            <button
              type="button"
              aria-expanded={showUnanswered}
              onClick={() => setShowUnanswered((v) => !v)}
              className="btn"
            >
              {fmt(m.unanswered, { n: unanswered.length })}
            </button>
            {!isLast && (
              <button type="button" onClick={requestSubmit} className="btn">
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
  chapterNotes,
}: {
  question: Question;
  /** 화면에 보이는 정답 번호 (선지를 줄였으면 원래 번호와 다르다) */
  answerNo: number;
  chosen: number | undefined;
  meta: { location: string; chapterImportance: number };
  chapterNotes?: { certId: string; subjects: Subject[] };
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
    <div role="status" className={`mt-6 rounded-lg p-4 ${correct ? "bg-ok-soft" : "bg-bad-soft"}`}>
      {/* 맞혔으면 "정답 ③", 틀렸으면 "오답 · 정답 ③" */}
      <p className="text-lg font-bold">
        {correct ? (
          <span className="text-ok">{fmt(m.answerIs, { answer: circled(answerNo) })}</span>
        ) : (
          <>
            <span className="text-bad">{m.wrong}</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            {fmt(m.answerIs, { answer: circled(answerNo) })}
          </>
        )}
      </p>
      <p className="mt-2">
        <span className="font-bold">{all.common.keyConcept}</span> {question.oneLineConcept}
      </p>
      <button
        type="button"
        aria-expanded={showExplanation}
        onClick={() => setShowExplanation((v) => !v)}
        className="btn mt-4 bg-surface"
      >
        {showExplanation ? m.hideExplanation : m.showExplanation}
      </button>
      {/* 해설: 상자 안에 상자를 넣지 않고 여백으로만 나눈다 */}
      {showExplanation && (
        <div className="mt-4 space-y-2">
          <p className="text-sm">
            {all.common.importance} <Stars value={stars} />
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            {m.passChance} <strong className="font-bold">{contribution.value}%</strong>
          </p>
          <p className="text-sm text-ink-sub">{meta.location}</p>
          <Markdown text={question.explanation} />
          <button
            type="button"
            className="min-h-11 text-sm font-bold text-ink-sub underline underline-offset-2"
            aria-expanded={showReport}
            onClick={() => setShowReport((v) => !v)}
          >
            {m.report}
          </button>
          {showReport && <ReportForm question={question} onClose={() => setShowReport(false)} />}
        </div>
      )}
      {!correct && chapterNotes && (
        <ChapterNotesLink
          certId={chapterNotes.certId}
          subjects={chapterNotes.subjects}
          question={question}
          className="mt-4"
        />
      )}
    </div>
  );
}
