"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { QuestionBadges } from "@/components/quiz/QuestionBadges";
import type { QuizCert } from "@/components/quiz/QuizRunner";
import { ResultView } from "@/components/quiz/ResultView";
import { circled, formatClock } from "@/lib/format";
import { buildMockExam, mockExamSeconds } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  clearCbt,
  finishCbt,
  getHistory,
  loadCbt,
  recordAnswer,
  saveCbt,
  startCbt,
  touchRecentCert,
  type CbtSession,
} from "@/lib/storage";
import type { Question } from "@/lib/types";
import { useHydrated, useStored } from "@/lib/use-storage";

const CHOICES = [1, 2, 3, 4];

/**
 * 실전 CBT 체험 모드.
 * 실제 큐넷 CBT 시험처럼 전체 문항 + 제한 시간 + 답안 표기란 + 안 푼 문제 확인 + 답안 제출 순서로 진행한다.
 * 풀이 중에는 채점하지 않고, 제출한 뒤에 한꺼번에 결과를 보여 준다.
 */
export function CbtRunner({ cert, questions }: { cert: QuizCert; questions: Question[] }) {
  const hydrated = useHydrated();
  const session = useStored<CbtSession | null>(STORAGE_KEYS.cbt(cert.id), null);
  // 안내 화면에서 "시작/이어서 풀기"를 눌러야 시계가 가기 시작한다
  const [running, setRunning] = useState(false);
  const [showUnanswered, setShowUnanswered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const examQuestions = session
    ? session.questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q)
    : [];
  const total = examQuestions.length;
  const inProgress = !!session && !session.finishedAt && total > 0;
  const ticking = running && inProgress;

  // 1초마다 남은 시간을 줄인다. 0 이 되면 자동으로 제출한다
  const onTick = useEffectEvent(() => {
    const latest = loadCbt(cert.id);
    if (!latest || latest.finishedAt) return;
    if (latest.remainingSec <= 1) submit(latest);
    else saveCbt({ ...latest, remainingSec: latest.remainingSec - 1 });
  });
  useEffect(() => {
    if (!ticking) return;
    const timer = window.setInterval(onTick, 1000);
    return () => window.clearInterval(timer);
  }, [ticking]);

  const index = session ? Math.min(session.currentIndex, Math.max(0, total - 1)) : 0;
  const question = examQuestions[index];

  const goTo = (i: number) => {
    if (!session) return;
    saveCbt({ ...session, currentIndex: Math.max(0, Math.min(total - 1, i)) });
    setShowUnanswered(false);
  };

  const mark = (questionId: string, choice: number) => {
    if (!session || session.finishedAt) return;
    saveCbt({ ...session, answers: { ...session.answers, [questionId]: choice } });
  };

  function submit(target: CbtSession) {
    finishCbt(target);
    for (const q of questions) {
      const chosen = target.answers[q.id];
      if (chosen !== undefined) recordAnswer(q.id, chosen === q.answer);
    }
    setRunning(false);
    setConfirming(false);
    window.scrollTo(0, 0);
  }

  const startNew = () => {
    const picked = buildMockExam({
      subjects: cert.subjects,
      questions,
      totalQuestions: cert.examInfo.totalQuestions,
      history: getHistory(),
    });
    startCbt(cert.id, picked.map((q) => q.id), mockExamSeconds(picked.length, cert.examInfo));
    touchRecentCert(cert.id);
    setRunning(true);
    window.scrollTo(0, 0);
  };

  // 키보드: 1~4 답 표기, ←/→ 이전·다음 문제
  useEffect(() => {
    if (!ticking || !question || confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        mark(question.id, Number(e.key));
      } else if (e.key === "ArrowRight" || (e.key === "Enter" && tag !== "BUTTON" && tag !== "A")) {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!hydrated) {
    return <p className="p-5 text-lg font-bold">시험을 준비하고 있습니다…</p>;
  }

  // ───────── 결과 ─────────
  if (session?.finishedAt && total > 0) {
    return (
      <ResultView
        cert={cert}
        label="실전 CBT 체험"
        answers={session.answers}
        questions={examQuestions}
        againAction={
          <button type="button" className="btn btn-lg" onClick={() => clearCbt(cert.id)}>
            실전 CBT 다시 보기 →
          </button>
        }
      />
    );
  }

  // ───────── 안내 화면 (시작 / 이어서 풀기) ─────────
  if (!ticking || !session || !question) {
    const plannedCount = Math.min(cert.examInfo.totalQuestions, questions.length);
    const plannedMinutes = Math.round(mockExamSeconds(plannedCount, cert.examInfo) / 60);
    const answered = session ? examQuestions.filter((q) => session.answers[q.id] !== undefined).length : 0;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <p className="text-[0.9rem] font-bold text-ink-sub">{cert.name}</p>
          <h1 className="text-2xl font-extrabold">실전 CBT 체험 모드</h1>
        </header>

        <div className="card space-y-3 p-4 sm:p-5">
          <p>
            실제 시험장 컴퓨터(CBT) 화면과 같은 순서로 풀어 보는 연습입니다. 컴퓨터로 보는 시험이
            낯설다면 시험 전에 한 번 끝까지 해 보세요.
          </p>
          <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[7rem_1fr]">
            <dt className="font-bold text-ink-sub">문항 수</dt>
            <dd className="font-bold">
              {plannedCount}문항 ({cert.subjects.map((s) => s.name).join(" · ")})
            </dd>
            <dt className="font-bold text-ink-sub">제한 시간</dt>
            <dd className="font-bold">{plannedMinutes}분</dd>
            <dt className="font-bold text-ink-sub">합격 기준</dt>
            <dd>{cert.examInfo.passCriteria.description}</dd>
          </dl>
          <h2 className="pt-2 text-lg font-extrabold">화면 사용법</h2>
          <ol className="list-decimal space-y-1 pl-6">
            <li>문제를 읽고 보기 ①~④ 중 하나를 누릅니다. 다시 누르면 답을 바꿀 수 있습니다.</li>
            <li>
              <strong>답안 표기란</strong>에서 내가 고른 답을 한눈에 보고, 문제 번호를 눌러 그 문제로
              바로 갈 수 있습니다.
            </li>
            <li>
              <strong>안 푼 문제</strong> 버튼을 누르면 아직 답을 고르지 않은 문제 번호가 나옵니다.
            </li>
            <li>
              다 풀었으면 <strong>답안 제출</strong>을 누릅니다. 제출하면 점수와 합격 여부를 바로 볼
              수 있습니다. 시간이 다 되면 자동으로 제출됩니다.
            </li>
          </ol>
          <p className="text-[0.9rem] text-ink-sub">
            풀이 중에는 정답을 알려 주지 않습니다. 중간에 창을 닫으면 시간이 멈추고, 다시 들어오면
            이어서 풀 수 있습니다.
          </p>
        </div>

        {inProgress && session ? (
          <div className="rounded-xl border-2 border-primary bg-primary-soft p-4">
            <p className="font-bold">
              풀던 시험이 있습니다. 푼 문제 {answered} / {total} · 남은 시간{" "}
              {formatClock(session.remainingSec)}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => setRunning(true)}>
                이어서 풀기 →
              </button>
              <button type="button" className="btn btn-lg" onClick={startNew}>
                처음부터 새로 시작
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-lg w-full" onClick={startNew}>
            시험 시작 →
          </button>
        )}

        <p>
          <Link href={`/cert/${cert.id}`} className="link">
            ← {cert.name} 페이지로 돌아가기
          </Link>
        </p>
      </div>
    );
  }

  // ───────── 시험 화면 ─────────
  const unanswered = examQuestions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => session.answers[q.id] === undefined);
  const chosen = session.answers[question.id];
  const lowTime = session.remainingSec <= 300;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border-2 border-line bg-surface px-3 py-2">
        <h1 className="font-extrabold">{cert.name} 실전 CBT 체험</h1>
        <p className="font-bold">
          제한 시간 {Math.round(session.totalSec / 60)}분 · 남은 시간{" "}
          <span
            role="timer"
            className={`text-xl font-extrabold tabular-nums ${lowTime ? "text-bad" : "text-accent"}`}
          >
            {formatClock(session.remainingSec)}
          </span>
        </p>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_17rem]">
        {/* 문제 */}
        <section aria-label="문제" className="card p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold">
              문제 {index + 1} / {total}
            </span>
            <QuestionBadges question={question} />
          </div>
          <h2 className="mt-2 text-[1.15rem] font-bold leading-normal sm:text-xl">
            {index + 1}. {question.stem}
          </h2>
          <ol className="mt-3 space-y-2">
            {question.choices.map((choice, i) => {
              const n = i + 1;
              const selected = chosen === n;
              return (
                <li key={n}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => mark(question.id, n)}
                    className={`flex min-h-[3.2rem] w-full items-center gap-3 rounded-lg border-2 px-3 py-1.5 text-left text-lg leading-snug ${
                      selected
                        ? "border-primary bg-primary-soft font-bold"
                        : "border-line bg-surface hover:border-ink"
                    }`}
                  >
                    <span aria-hidden="true" className="shrink-0 text-xl font-bold">
                      {circled(n)}
                    </span>
                    <span className="sr-only">{n}번</span>
                    <span className="min-w-0 flex-1">{choice}</span>
                    {selected && <span className="shrink-0 text-[1rem] font-extrabold">✔ 선택</span>}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" className="btn btn-lg" disabled={index === 0} onClick={() => goTo(index - 1)}>
              ← 이전 문제
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={index + 1 >= total}
              onClick={() => goTo(index + 1)}
            >
              다음 문제 →
            </button>
          </div>
        </section>

        {/* 답안 표기란 */}
        <aside aria-label="답안 표기란" className="card p-3">
          <h2 className="font-extrabold">
            답안 표기란{" "}
            <span className="text-[0.9rem] font-bold text-ink-sub">
              (푼 문제 {total - unanswered.length} / {total})
            </span>
          </h2>
          <ol className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3 lg:max-h-[26rem] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1">
            {examQuestions.map((q, i) => {
              const marked = session.answers[q.id];
              return (
                <li
                  key={q.id}
                  className={`flex items-center gap-1 rounded px-1 ${i === index ? "bg-primary-soft" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`${i + 1}번 문제로 가기${marked === undefined ? " (안 푼 문제)" : ""}`}
                    aria-current={i === index ? "true" : undefined}
                    className={`h-9 w-9 shrink-0 rounded text-[0.9rem] font-extrabold underline ${
                      marked === undefined ? "text-bad" : "text-ink"
                    }`}
                  >
                    {i + 1}
                  </button>
                  {CHOICES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${i + 1}번 문제 답 ${n}번 표기`}
                      aria-pressed={marked === n}
                      onClick={() => mark(q.id, n)}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[0.85rem] font-bold ${
                        marked === n
                          ? "border-ink bg-ink text-surface"
                          : "border-line bg-surface text-ink hover:border-ink"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-line bg-surface p-3">
        <button
          type="button"
          className="btn"
          aria-expanded={showUnanswered}
          onClick={() => setShowUnanswered((v) => !v)}
        >
          안 푼 문제 ({unanswered.length}개) {showUnanswered ? "▲" : "▼"}
        </button>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={() => setRunning(false)}>
            잠시 멈추기
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setConfirming(true)}>
            답안 제출
          </button>
        </div>
      </div>

      {showUnanswered && (
        <div className="card mt-2 p-3">
          {unanswered.length === 0 ? (
            <p className="font-bold">모든 문제에 답을 표기했습니다.</p>
          ) : (
            <>
              <p className="font-bold">아직 답을 고르지 않은 문제입니다. 번호를 누르면 그 문제로 갑니다.</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {unanswered.map(({ q, i }) => (
                  <li key={q.id}>
                    <button type="button" className="btn min-h-11 min-w-12 px-2 py-1" onClick={() => goTo(i)}>
                      {i + 1}번
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {confirming && (
        <div role="alertdialog" aria-labelledby="submit-title" className="mt-2 rounded-lg border-2 border-primary bg-primary-soft p-4">
          <h2 id="submit-title" className="text-lg font-extrabold">
            답안을 제출할까요?
          </h2>
          <p className="mt-1">
            {unanswered.length > 0
              ? `아직 안 푼 문제가 ${unanswered.length}개 있습니다. 제출하면 안 푼 문제는 틀린 것으로 채점됩니다.`
              : "모든 문제에 답을 표기했습니다."}{" "}
            제출한 뒤에는 답을 바꿀 수 없습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => submit(session)}>
              네, 제출합니다
            </button>
            <button type="button" className="btn btn-lg" onClick={() => setConfirming(false)}>
              아니요, 계속 풉니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
