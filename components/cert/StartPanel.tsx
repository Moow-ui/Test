"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { DEFAULT_QUIZ_COUNT, LEVEL_RULES, QUIZ_COUNTS } from "@/lib/quiz-engine";
import { setLastLevel } from "@/lib/storage";
import type { QuizLevel } from "@/lib/types";

const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

export interface StartPanelProps {
  certId: string;
  certName: string;
  subjects: Array<{ id: string; name: string }>;
  /** 난이도 → 범위("all" 또는 과목 id) → 보유 문제 수 */
  counts: Record<QuizLevel, Record<string, number>>;
  /** 권리가 확인되어 등록된 기출문제 수 */
  pastCount: number;
  cbt: { questionCount: number; minutes: number } | null;
}

/** 문제 풀기 탭: 난이도 카드 3개 → 범위 → 문항 수 → 시작 */
export function StartPanel({ certId, certName, subjects, counts, pastCount, cbt }: StartPanelProps) {
  const [level, setLevel] = useState<QuizLevel>("basic");
  const [scope, setScope] = useState("all");
  const [count, setCount] = useState<number>(DEFAULT_QUIZ_COUNT);

  const available = counts[level][scope] ?? 0;
  // 고른 문항 수가 보유 문제보다 많으면, 가능한 가장 큰 문항 수로 낮춘다
  const possible = QUIZ_COUNTS.filter((c) => c <= available);
  const effectiveCount = count <= available ? count : (possible[possible.length - 1] ?? null);
  const scopes = [{ id: "all", name: "전체 과목" }, ...subjects];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-extrabold">{certName} 문제 풀기</h2>

      {pastCount === 0 && (
        <p className="rounded-lg border border-warn bg-warn-soft p-3 text-[0.95rem]">
          <strong>안내:</strong> 이 자격증은 권리가 확인된 기출문제가 아직 등록되지 않아, 지금은 모든
          문제가 <strong>AI 예상문제</strong>로 나옵니다. 기출문제가 등록되면 초급·중급은 기출
          위주로, 고급은 기출과 예상문제가 절반씩 나옵니다.
        </p>
      )}

      <fieldset>
        <legend className="text-lg font-bold">1. 난이도를 고르세요</legend>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {LEVELS.map((id) => {
            const rule = LEVEL_RULES[id];
            const active = level === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setLevel(id)}
                className={`rounded-lg border-2 p-3 text-left ${
                  active ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-ink"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold">
                    {rule.label} <span className="text-[0.95rem] font-bold">· {rule.title}</span>
                  </span>
                  {active && <Badge tone="primary">선택됨</Badge>}
                </span>
                <span className="mt-1 block text-[0.9rem]">{rule.description}</span>
                <span className="mt-1 block text-[0.85rem] font-bold text-ink-sub">
                  보유 문제 {counts[id].all ?? 0}개
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">2. 범위를 고르세요</legend>
        <div className="mt-2 flex flex-wrap gap-2">
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
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">3. 몇 문제를 풀까요?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                className={`min-h-14 rounded-lg border-2 px-2 text-lg font-extrabold ${
                  active
                    ? "border-primary bg-primary text-white"
                    : enough
                      ? "border-line bg-surface text-ink hover:border-ink"
                      : "border-line-soft bg-surface-2 text-ink-sub"
                }`}
              >
                {c}문제
                {!enough && <span className="block text-[0.8rem] font-bold">문제 부족</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[0.9rem] text-ink-sub">
          지금 고른 조건으로 풀 수 있는 문제는 {available}개입니다. 문제가 모자란 문항 수는 누를 수
          없습니다.
        </p>
      </fieldset>

      {effectiveCount === null ? (
        <p className="rounded-lg border border-bad bg-bad-soft p-3 font-bold">
          이 조건에는 문제가 {QUIZ_COUNTS[0]}개보다 적어 풀 수 없습니다. 난이도나 범위를 바꿔 주세요.
        </p>
      ) : (
        <Link
          href={`/cert/${certId}/quiz?level=${level}&count=${effectiveCount}&subject=${scope}`}
          onClick={() => setLastLevel(level)}
          className="btn btn-primary btn-lg w-full"
        >
          {LEVEL_RULES[level].label} {effectiveCount}문제 풀기 시작 →
        </Link>
      )}

      {cbt && (
        <div className="rounded-lg border-2 border-line p-3 sm:p-4">
          <h3 className="text-lg font-extrabold">실전 CBT 체험 모드</h3>
          <p className="mt-1 text-[0.95rem]">
            실제 시험장 컴퓨터 화면처럼 <strong>{cbt.questionCount}문항</strong>을{" "}
            <strong>{cbt.minutes}분</strong> 안에 풉니다. 답안 표기란과 &lsquo;안 푼 문제&rsquo;
            확인까지 그대로 연습할 수 있어, 컴퓨터 시험이 낯선 분께 권합니다.
          </p>
          <Link href={`/cert/${certId}/cbt`} className="btn btn-lg mt-3 w-full sm:w-auto">
            실전 CBT 체험하기 →
          </Link>
        </div>
      )}
    </div>
  );
}
