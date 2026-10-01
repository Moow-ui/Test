"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { LEVEL_RULES, QUIZ_COUNTS } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  isInProgress,
  setLastLevel,
  touchRecentCert,
  type QuizSession,
} from "@/lib/storage";
import type { QuizLevel } from "@/lib/types";
import { useStored } from "@/lib/use-storage";

type BoxId = QuizLevel | "analysis";

const BOXES: Array<{ id: BoxId; label: string; hint: string }> = [
  { id: "basic", label: "초급", hint: "기본 문제" },
  { id: "intermediate", label: "중급", hint: "합격선" },
  { id: "advanced", label: "고급", hint: "심화 문제" },
  { id: "analysis", label: "출제 분석", hint: "단원별 비중" },
];

export interface CertBoxesProps {
  certId: string;
  subjects: Array<{ id: string; name: string }>;
  /** 난이도 → 범위("all" 또는 과목 id) → 보유 문제 수 */
  counts: Record<QuizLevel, Record<string, number>>;
  /** 권리가 확인되어 등록된 기출문제 수 */
  pastCount: number;
  cbt: { questionCount: number; minutes: number };
  /** 출제 분석 내용 (서버에서 HTML 로 그려져 검색엔진이 읽을 수 있다) */
  analysis: ReactNode;
}

/**
 * 자격증 화면에서 가장 먼저 보이는 박스 4개: 초급 / 중급 / 고급 / 출제 분석.
 * 박스를 누르면 바로 아래에 내용이 펼쳐진다.
 *  - 초급·중급·고급: 범위 → 문제 수(누르면 바로 시작) → CBT
 *  - 출제 분석: 과목·단원별 중요도와 출제 비중
 */
export function CertBoxes({ certId, subjects, counts, pastCount, cbt, analysis }: CertBoxesProps) {
  const [open, setOpen] = useState<BoxId | null>(null);
  const [scope, setScope] = useState("all");
  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(certId), null);

  // 이 자격증을 "최근 공부한 자격증"으로 기록한다 (홈의 바로 풀기 버튼용)
  useEffect(() => {
    touchRecentCert(certId);
  }, [certId]);

  const level = open !== null && open !== "analysis" ? open : null;
  const scopes = [{ id: "all", name: "전체" }, ...subjects];
  const available = level ? (counts[level][scope] ?? 0) : 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BOXES.map((box) => {
          const active = open === box.id;
          return (
            <button
              key={box.id}
              type="button"
              aria-expanded={active}
              aria-controls="cert-box-detail"
              onClick={() => setOpen(active ? null : box.id)}
              className={`flex min-h-24 flex-col items-center justify-center rounded-xl border-2 px-2 py-3 ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink hover:border-ink"
              }`}
            >
              <span className="text-2xl font-extrabold">{box.label}</span>
              <span className={`text-[0.8rem] font-bold ${active ? "text-white" : "text-ink-sub"}`}>
                {box.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div id="cert-box-detail">
        {level && (
          <div className="mt-2 rounded-xl border-2 border-primary bg-surface p-3 sm:p-4">
            <h2 className="font-extrabold">
              {LEVEL_RULES[level].label} · {LEVEL_RULES[level].title}
            </h2>

            <dl className="mt-3 grid items-center gap-x-3 gap-y-3 sm:grid-cols-[3.5rem_1fr]">
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
                {QUIZ_COUNTS.map((count) =>
                  count <= available ? (
                    <Link
                      key={count}
                      href={`/cert/${certId}/quiz?level=${level}&count=${count}&subject=${scope}`}
                      onClick={() => setLastLevel(level)}
                      className="btn btn-primary min-h-14 px-1 text-lg"
                    >
                      {count}문제
                    </Link>
                  ) : (
                    <button key={count} type="button" disabled className="btn min-h-14 px-1 text-lg">
                      {count}문제
                    </button>
                  ),
                )}
              </dd>

              <dt className="font-bold">CBT</dt>
              <dd>
                <Link href={`/cert/${certId}/cbt`} className="btn min-h-12 w-full sm:w-auto">
                  실전 CBT 체험 ({cbt.questionCount}문항·{cbt.minutes}분) →
                </Link>
              </dd>
            </dl>

            <p className="mt-3 text-[0.75rem] text-ink-sub">
              문제 수를 누르면 바로 시작합니다. 회색 버튼은 문제가 부족해 고를 수 없습니다.
              {pastCount === 0 && " 지금은 모든 문제가 AI 예상문제입니다."}
            </p>
          </div>
        )}

        <div
          hidden={open !== "analysis"}
          className="mt-2 rounded-xl border-2 border-primary bg-surface p-3 sm:p-4"
        >
          {analysis}
        </div>
      </div>

      {/* 풀던 문제가 남아 있을 때만 보인다 */}
      {isInProgress(session) && (
        <Link href={`/cert/${certId}/quiz`} className="btn mt-2 w-full">
          이어서 풀기 ({session.currentIndex + 1}/{session.questionIds.length}) →
        </Link>
      )}
    </div>
  );
}
