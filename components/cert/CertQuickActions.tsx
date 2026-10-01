"use client";

import Link from "next/link";
import { useEffect } from "react";
import { DEFAULT_QUIZ_COUNT, LEVEL_RULES } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  isInProgress,
  touchRecentCert,
  type QuizSession,
} from "@/lib/storage";
import type { QuizLevel } from "@/lib/types";
import { useStored } from "@/lib/use-storage";

/**
 * 자격증 상세 상단의 빠른 시작 버튼.
 * 풀던 문제가 있으면 "이어서 풀기", 없으면 "바로 5문제 풀기".
 * 이 자격증을 "최근 공부한 자격증"으로 기록하는 일도 함께 한다.
 */
export function CertQuickActions({ certId }: { certId: string }) {
  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(certId), null);
  const stored = useStored<string | null>(STORAGE_KEYS.lastLevel, null);
  const level: QuizLevel = stored === "intermediate" || stored === "advanced" ? stored : "basic";

  useEffect(() => {
    touchRecentCert(certId);
  }, [certId]);

  const startHref = `/cert/${certId}/quiz?level=${level}&count=${DEFAULT_QUIZ_COUNT}&subject=all`;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {isInProgress(session) ? (
        <>
          <Link href={`/cert/${certId}/quiz`} className="btn btn-primary btn-lg">
            이어서 풀기 ({session.currentIndex + 1}/{session.questionIds.length}번 문제부터) →
          </Link>
          <Link href={startHref} className="btn btn-lg">
            새로 {DEFAULT_QUIZ_COUNT}문제 풀기 →
          </Link>
        </>
      ) : (
        <Link href={startHref} className="btn btn-primary btn-lg">
          바로 {DEFAULT_QUIZ_COUNT}문제 풀기 ({LEVEL_RULES[level].label}) →
        </Link>
      )}
    </div>
  );
}
