"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

/** 난이도별 박스 색: 고르기 전, 고른 뒤, 펼친 칸 테두리 */
const LEVEL_STYLE: Record<QuizLevel, { idle: string; active: string; border: string }> = {
  basic: { idle: "border-lv1 bg-lv1-soft text-ink", active: "border-lv1 bg-lv1 text-white", border: "border-lv1" },
  intermediate: { idle: "border-lv2 bg-lv2-soft text-ink", active: "border-lv2 bg-lv2 text-white", border: "border-lv2" },
  advanced: { idle: "border-lv3 bg-lv3-soft text-ink", active: "border-lv3 bg-lv3 text-white", border: "border-lv3" },
};

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
}

/**
 * 자격증 화면에서 가장 먼저 보이는 큰 박스: 초급 / 중급 / 고급, 그 아래 실전 문제풀이.
 * 난이도 박스를 누르면 바로 아래에 범위·문제 수·[시험 시작하기] 가 펼쳐진다.
 */
export function CertBoxes({ certId, ready, subjects, counts, choiceCounts, cbt }: CertBoxesProps) {
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
              className={`flex min-h-32 flex-col items-center justify-center gap-1 rounded-2xl border-2 text-3xl font-extrabold shadow-[var(--shadow)] sm:min-h-40 sm:text-5xl ${
                !ready
                  ? "border-line-soft bg-surface-2 text-ink-sub"
                  : active
                    ? LEVEL_STYLE[id].active
                    : `${LEVEL_STYLE[id].idle} hover:border-ink`
              }`}
            >
              {m.levels[id]}
              <span className="text-[0.95rem] font-bold sm:text-lg">{fmt(m.cert.choiceCount, { n: choiceCounts[id] })}</span>
            </button>
          );
        })}
      </div>

      <div id="level-detail">
        {level && (
          <div className={`rounded-2xl border-2 bg-surface p-3 shadow-[var(--shadow)] sm:p-4 ${LEVEL_STYLE[level].border}`}>
            <dl className="grid items-center gap-x-3 gap-y-3 sm:grid-cols-[4.5rem_1fr]">
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
                      className={`min-h-12 rounded-lg border-2 px-4 font-bold ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-line bg-surface text-ink hover:border-ink"
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
                      className={`min-h-12 rounded-lg border-2 px-1 text-lg font-extrabold ${
                        active
                          ? "border-primary bg-primary text-white"
                          : enough
                            ? "border-line bg-surface text-ink hover:border-ink"
                            : "border-line-soft bg-surface-2 text-ink-sub"
                      }`}
                    >
                      {fmt(m.common.questions, { n: c })}
                    </button>
                  );
                })}
              </dd>
            </dl>

            {effectiveCount === null ? (
              <p className="mt-3 rounded-lg border border-bad bg-bad-soft p-3 font-bold">
                {fmt(m.cert.notEnough, { level: m.levels[level] })}
              </p>
            ) : (
              <Link
                href={`${certPath}/quiz?level=${level}&count=${effectiveCount}&subject=${scope}`}
                onClick={() => setLastLevel(level)}
                className="btn btn-primary btn-lg mt-3 w-full"
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
          className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border-2 border-header bg-header px-5 text-white shadow-[var(--shadow)] hover:border-focus"
        >
          <span className="text-xl font-extrabold sm:text-2xl">{m.cert.cbt}</span>
          <span className="font-bold">{fmt(m.cert.cbtInfo, { n: cbt.questionCount, min: cbt.minutes, choices: cbt.choiceCount })}</span>
        </Link>
      ) : (
        <div className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border-2 border-line-soft bg-surface-2 px-5 text-ink-sub">
          <span className="text-xl font-extrabold sm:text-2xl">{m.cert.cbt}</span>
          <span className="font-bold">{m.cert.cbtNotReady}</span>
        </div>
      )}

      {/* 풀던 문제가 남아 있을 때만 보인다 */}
      {isInProgress(session) && (
        <Link href={`${certPath}/quiz`} className="btn w-full">
          {fmt(m.cert.resume, { current: session.currentIndex + 1, total: session.questionIds.length })}
        </Link>
      )}
    </div>
  );
}
