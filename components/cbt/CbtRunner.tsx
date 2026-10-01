"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { ExamScreen } from "@/components/exam/ExamScreen";
import type { QuizCert } from "@/components/quiz/QuizRunner";
import { ResultView } from "@/components/quiz/ResultView";
import { formatClock } from "@/lib/format";
import { buildMockExam, mockExamSeconds } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  addResult,
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

const NO_REVEAL: Record<string, boolean> = {};

function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:py-6">{children}</div>;
}

/**
 * 실전 CBT 체험 모드.
 * 실제 큐넷 CBT 시험처럼 전체 문항 + 제한 시간 + 답안 표기란 + 안 푼 문제 확인 + 답안 제출 순서로 진행한다.
 * 풀이 중에는 채점하지 않고, 제출한 뒤에 한꺼번에 결과를 보여 준다.
 * 시험 화면 자체는 연습 풀이와 같은 components/exam/ExamScreen.tsx 를 쓴다.
 */
export function CbtRunner({ cert, questions }: { cert: QuizCert; questions: Question[] }) {
  const hydrated = useHydrated();
  const session = useStored<CbtSession | null>(STORAGE_KEYS.cbt(cert.id), null);
  // 안내 화면에서 "시작/이어서 풀기"를 눌러야 시계가 가기 시작한다
  const [running, setRunning] = useState(false);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const examQuestions = session
    ? session.questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q)
    : [];
  const total = examQuestions.length;
  const inProgress = !!session && !session.finishedAt && total > 0;
  const ticking = running && inProgress;

  function submit(target: CbtSession) {
    finishCbt(target);
    const asked = target.questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is Question => !!q);
    for (const q of asked) {
      const chosen = target.answers[q.id];
      if (chosen !== undefined) recordAnswer(q.id, chosen === q.answer, cert.id);
    }
    const wrongIds = asked.filter((q) => target.answers[q.id] !== q.answer).map((q) => q.id);
    if (asked.length > 0) {
      addResult({
        certId: cert.id,
        label: "실전 CBT 체험",
        kind: "cbt",
        total: asked.length,
        correct: asked.length - wrongIds.length,
        score: Math.round(((asked.length - wrongIds.length) / asked.length) * 100),
        wrongIds,
      });
    }
    setRunning(false);
    window.scrollTo(0, 0);
  }

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

  if (!hydrated) {
    return (
      <Pad>
        <p className="card p-5 text-lg font-bold">시험을 준비하고 있습니다…</p>
      </Pad>
    );
  }

  // ───────── 결과 ─────────
  if (session?.finishedAt && total > 0) {
    return (
      <Pad>
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
      </Pad>
    );
  }

  // ───────── 시험 화면 ─────────
  if (ticking && session) {
    return (
      <ExamScreen
        certName={cert.name}
        modeLabel="실전 CBT 체험"
        exitHref={`/cert/${cert.id}`}
        questions={examQuestions}
        index={Math.min(session.currentIndex, total - 1)}
        answers={session.answers}
        revealed={NO_REVEAL}
        timer={{ remainingSec: session.remainingSec, totalSec: session.totalSec }}
        submitLabel="답안 제출"
        onSelect={(q, choice) => saveCbt({ ...session, answers: { ...session.answers, [q.id]: choice } })}
        onGoTo={(i) => saveCbt({ ...session, currentIndex: i })}
        onSubmit={() => submit(session)}
        onPause={() => setRunning(false)}
        metaOf={() => ({ location: "", chapterImportance: 3 })}
      />
    );
  }

  // ───────── 안내 화면 (시작 / 이어서 풀기) ─────────
  const plannedCount = Math.min(cert.examInfo.totalQuestions, questions.length);
  const plannedMinutes = Math.round(mockExamSeconds(plannedCount, cert.examInfo) / 60);
  const answered = session ? examQuestions.filter((q) => session.answers[q.id] !== undefined).length : 0;

  return (
    <Pad>
      <div className="mx-auto max-w-3xl space-y-5">
        <header>
          <p className="text-[0.9rem] font-bold text-ink-sub">{cert.name}</p>
          <h1 className="text-2xl font-extrabold">실전 CBT 체험</h1>
        </header>

        <dl className="card grid gap-x-4 gap-y-1 p-4 sm:grid-cols-[6rem_1fr]">
          <dt className="font-bold text-ink-sub">문항 수</dt>
          <dd className="font-bold">{plannedCount}문항</dd>
          <dt className="font-bold text-ink-sub">제한 시간</dt>
          <dd className="font-bold">{plannedMinutes}분</dd>
          <dt className="font-bold text-ink-sub">합격 기준</dt>
          <dd>{cert.examInfo.passCriteria.description}</dd>
        </dl>

        {inProgress && session ? (
          <div className="rounded-xl border-2 border-primary bg-primary-soft p-4">
            <p className="font-bold">
              풀던 시험이 있습니다. 푼 문제 {answered} / {total} · 남은 시간 {formatClock(session.remainingSec)}
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
            시험 시작하기 →
          </button>
        )}

        <details className="card">
          <summary className="flex min-h-14 items-center justify-between px-4 font-bold">
            화면 사용법
            <span className="text-[0.85rem] text-accent">
              <span className="when-closed">▼ 보기</span>
              <span className="when-open">▲ 접기</span>
            </span>
          </summary>
          <ol className="list-decimal space-y-1 border-t border-line-soft p-4 pl-9 text-[0.95rem]">
            <li>문제를 읽고 보기 ①~④ 중 하나를 누릅니다. 다시 누르면 답을 바꿀 수 있습니다.</li>
            <li>답안 표기란에서 내가 고른 답을 한눈에 보고, 문제 번호를 눌러 그 문제로 갈 수 있습니다.</li>
            <li>&lsquo;안 푼 문제&rsquo;를 누르면 아직 답을 고르지 않은 문제 번호가 나옵니다.</li>
            <li>다 풀었으면 &lsquo;답안 제출&rsquo;을 누릅니다. 시간이 다 되면 자동으로 제출됩니다.</li>
            <li>풀이 중에는 정답을 알려 주지 않습니다. 창을 닫으면 시간이 멈추고 다시 들어오면 이어집니다.</li>
          </ol>
        </details>

        <p>
          <Link href={`/cert/${cert.id}`} className="link">
            ← {cert.name} 화면으로 돌아가기
          </Link>
        </p>
      </div>
    </Pad>
  );
}
