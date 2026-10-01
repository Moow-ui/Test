"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_QUIZ_COUNT, LEVEL_RULES, QUIZ_COUNTS } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  isInProgress,
  setLastLevel,
  touchRecentCert,
  type QuizSession,
} from "@/lib/storage";
import type { QuizLevel } from "@/lib/types";
import { useStored } from "@/lib/use-storage";

const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

export interface CertBoxesProps {
  certId: string;
  /** 풀 수 있는 문제가 있는가. false 면 박스가 모두 비활성화된다 */
  ready: boolean;
  subjects: Array<{ id: string; name: string }>;
  /** 난이도 → 범위("all" 또는 과목 id) → 보유 문제 수 */
  counts: Record<QuizLevel, Record<string, number>>;
  /** 실전 CBT 체험 정보. 문제가 없으면 null */
  cbt: { questionCount: number; minutes: number } | null;
}

/**
 * 자격증 화면에서 가장 먼저 보이는 큰 박스: 초급 / 중급 / 고급, 그 아래 실전 CBT 체험.
 * 난이도 박스를 누르면 바로 아래에 범위·문제 수·[시험 시작하기] 가 펼쳐진다.
 */
export function CertBoxes({ certId, ready, subjects, counts, cbt }: CertBoxesProps) {
  const [level, setLevel] = useState<QuizLevel | null>(null);
  const [scope, setScope] = useState("all");
  const [count, setCount] = useState<number>(DEFAULT_QUIZ_COUNT);
  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(certId), null);

  // 이 자격증을 "최근 공부한 자격증"으로 기록한다 (홈의 바로 풀기 버튼용)
  useEffect(() => {
    if (ready) touchRecentCert(certId);
  }, [certId, ready]);

  const scopes = [{ id: "all", name: "전체" }, ...subjects];
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
              className={`flex min-h-32 items-center justify-center rounded-xl border-2 text-3xl font-extrabold sm:min-h-40 sm:text-5xl ${
                !ready
                  ? "border-line-soft bg-surface-2 text-ink-sub"
                  : active
                    ? "border-primary bg-primary text-white"
                    : "border-line bg-surface text-ink hover:border-ink"
              }`}
            >
              {LEVEL_RULES[id].label}
            </button>
          );
        })}
      </div>

      <div id="level-detail">
        {level && (
          <div className="rounded-xl border-2 border-primary bg-surface p-3 sm:p-4">
            <dl className="grid items-center gap-x-3 gap-y-3 sm:grid-cols-[3.5rem_1fr]">
              <dt className="font-bold">범위</dt>
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

              <dt className="font-bold">문제</dt>
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
                      {c}문제
                    </button>
                  );
                })}
              </dd>
            </dl>

            {effectiveCount === null ? (
              <p className="mt-3 rounded-lg border border-bad bg-bad-soft p-3 font-bold">
                이 범위에는 {LEVEL_RULES[level].label} 문제가 부족합니다. 범위나 난이도를 바꿔 주세요.
              </p>
            ) : (
              <Link
                href={`/cert/${certId}/quiz?level=${level}&count=${effectiveCount}&subject=${scope}`}
                onClick={() => setLastLevel(level)}
                className="btn btn-primary btn-lg mt-3 w-full"
              >
                시험 시작하기 →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 실전 CBT 체험은 난이도와 별개의 칸으로 둔다 */}
      {cbt ? (
        <Link
          href={`/cert/${certId}/cbt`}
          className="flex min-h-20 items-center justify-between gap-3 rounded-xl border-2 border-line bg-surface px-4 hover:border-ink"
        >
          <span className="text-xl font-extrabold sm:text-2xl">실전 CBT 체험</span>
          <span className="font-bold text-ink-sub">
            {cbt.questionCount}문항 · {cbt.minutes}분 →
          </span>
        </Link>
      ) : (
        <div className="flex min-h-20 items-center justify-between gap-3 rounded-xl border-2 border-line-soft bg-surface-2 px-4 text-ink-sub">
          <span className="text-xl font-extrabold sm:text-2xl">실전 CBT 체험</span>
          <span className="font-bold">문제 준비 중</span>
        </div>
      )}

      {/* 풀던 문제가 남아 있을 때만 보인다 */}
      {isInProgress(session) && (
        <Link href={`/cert/${certId}/quiz`} className="btn w-full">
          이어서 풀기 ({session.currentIndex + 1}/{session.questionIds.length}) →
        </Link>
      )}
    </div>
  );
}
