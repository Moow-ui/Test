"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConceptsLink } from "@/components/cert/ConceptsLink";
import { fmt, localePath } from "@/lib/i18n";
import { DEFAULT_QUIZ_COUNT, QUIZ_COUNTS } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  isInProgress,
  setLastLevel,
  touchRecentCert,
  type QuizSession,
} from "@/lib/storage";
import type { QuizLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { useStored } from "@/lib/use-storage";

const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

/** 난이도 박스 색: 강조색(파랑) 하나로. 고르기 전은 연한 파랑, 고른 박스만 진한 파랑 */
const LEVEL_IDLE = "border-transparent bg-primary-soft text-ink hover:border-primary";
const LEVEL_ACTIVE = "border-primary bg-primary text-white";

export interface CertBoxesProps {
  certId: string;
  /** 풀 수 있는 문제가 있는가. false 면 박스가 모두 비활성화된다 */
  ready: boolean;
  subjects: Array<{ id: string; name: string }>;
  /** 난이도 → 범위("all" 또는 과목 id) → 보유 문제 수 */
  counts: Record<QuizLevel, Record<string, number>>;
  /** 난이도 → 한 문제에 보여 주는 선지 수 (초급 2 · 중급 3 · 고급 4) */
  choiceCounts: Record<QuizLevel, number>;
  /** 실전 문제풀이 정보 (실제 시험과 같은 문항 수·시간·선지 수). 문제가 모자라면 null */
  cbt: { questionCount: number; minutes: number; choiceCount: number } | null;
  /** 실전 문제풀이 아래에 "단원별 핵심 개념 먼저 보기" 한 줄 링크를 둘까 (단원 페이지가 있는 자격증만) */
  showConcepts?: boolean;
  /** 개념 정리 페이지 주소 (있으면 "핵심 개념 먼저 보기"가 그 페이지로 간다) */
  conceptsHref?: string;
}

/**
 * 자격증 화면에서 가장 먼저 보이는 큰 박스: 초급 / 중급 / 고급, 그 아래 실전 문제풀이.
 * 난이도 박스를 누르면 바로 아래에 범위·문제 수·[시험 시작하기] 가 펼쳐진다.
 */
export function CertBoxes({ certId, ready, subjects, counts, choiceCounts, cbt, showConcepts = false, conceptsHref }: CertBoxesProps) {
  const { locale, m } = useMessages();
  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [scope, setScope] = useState("all");
  const [count, setCount] = useState<number>(DEFAULT_QUIZ_COUNT);
  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(certId), null);
  const certPath = localePath(locale, `/cert/${certId}`);

  // 이 자격증을 "최근 공부한 자격증"으로 기록한다 (홈의 바로 풀기 버튼용)
  useEffect(() => {
    if (ready) touchRecentCert(certId);
  }, [certId, ready]);

  const scopes = [{ id: "all", name: m.common.all }, ...subjects];
  const available = level ? (counts[level][scope] ?? 0) : 0;
  // 고른 문제 수가 보유 문제보다 많으면, 가능한 가장 큰 문제 수로 낮춘다
  const possible = QUIZ_COUNTS.filter((c) => c <= available);
  const effectiveCount = count <= available ? count : (possible[possible.length - 1] ?? null);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((id) => {
          const active = level === id;
          return (
            <button
              key={id}
              type="button"
              disabled={!ready}
              aria-expanded={active}
              aria-controls="level-detail"
              onClick={() => setLevel(active ? null : id)}
              className={`flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 text-xl font-bold sm:min-h-40 sm:text-2xl ${
                !ready
                  ? "border-transparent bg-surface-2 text-ink-sub"
                  : active
                    ? LEVEL_ACTIVE
                    : LEVEL_IDLE
              }`}
            >
              {m.levels[id]}
              <span className="text-sm font-normal sm:text-base">{fmt(m.cert.choiceCount, { n: choiceCounts[id] })}</span>
            </button>
          );
        })}
      </div>

      <div id="level-detail">
        {level && (
          <div className="rounded-2xl bg-surface p-4 sm:p-6">
            <dl className="grid items-center gap-x-4 gap-y-4 sm:grid-cols-[4.5rem_1fr]">
              <dt className="font-bold">{m.cert.scope}</dt>
              <dd className="flex flex-wrap gap-2">
                {scopes.map((s) => {
                  const active = scope === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setScope(s.id)}
                      className={`min-h-12 rounded-lg px-4 font-bold ${
                        active ? "bg-primary text-white" : "bg-surface-2 text-ink hover:bg-primary-soft"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </dd>

              <dt className="font-bold">{m.cert.count}</dt>
              <dd className="grid grid-cols-4 gap-2">
                {QUIZ_COUNTS.map((c) => {
                  const enough = c <= available;
                  const active = enough && effectiveCount === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={!enough}
                      aria-pressed={active}
                      onClick={() => setCount(c)}
                      className={`min-h-12 rounded-lg px-2 text-lg font-bold ${
                        active
                          ? "bg-primary text-white"
                          : enough
                            ? "bg-surface-2 text-ink hover:bg-primary-soft"
                            : "bg-surface-2 text-ink-sub opacity-60"
                      }`}
                    >
                      {fmt(m.common.questions, { n: c })}
                    </button>
                  );
                })}
              </dd>
            </dl>

            {effectiveCount === null ? (
              <p className="mt-4 rounded-lg bg-bad-soft p-4 font-bold">
                {fmt(m.cert.notEnough, { level: m.levels[level] })}
              </p>
            ) : (
              <Link
                href={`${certPath}/quiz?level=${level}&count=${effectiveCount}&subject=${scope}`}
                onClick={() => setLastLevel(level)}
                className="btn btn-primary btn-lg mt-4 w-full"
              >
                {m.cert.start}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 실전 문제풀이은 난이도와 별개의 칸으로 둔다 */}
      {cbt ? (
        <Link
          href={`${certPath}/cbt`}
          className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border-2 border-transparent bg-surface px-6 text-ink hover:border-primary"
        >
          <span className="text-lg font-bold">{m.cert.cbt}</span>
          <span>{fmt(m.cert.cbtInfo, { n: cbt.questionCount, min: cbt.minutes, choices: cbt.choiceCount })}</span>
        </Link>
      ) : (
        <div className="flex min-h-20 items-center justify-between gap-4 rounded-2xl bg-surface-2 px-6 text-ink-sub">
          <span className="text-lg font-bold">{m.cert.cbt}</span>
          <span>{m.cert.cbtNotReady}</span>
        </div>
      )}

      {/* 단원 핵심정리로 가는 얇은 한 줄 (문제 박스보다 눈에 덜 띄게) */}
      {showConcepts && <ConceptsLink href={conceptsHref} />}

      {/* 풀던 문제가 남아 있을 때만 보인다 */}
      {isInProgress(session) && (
        <Link href={`${certPath}/quiz`} className="btn w-full">
          {fmt(m.cert.resume, { current: session.currentIndex + 1, total: session.questionIds.length })}
        </Link>
      )}
    </div>
  );
}
