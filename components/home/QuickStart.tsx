"use client";

import Link from "next/link";
import { DEFAULT_QUIZ_COUNT, LEVEL_RULES } from "@/lib/quiz-engine";
import {
  EMPTY_RECENT,
  STORAGE_KEYS,
  isInProgress,
  type QuizSession,
  type RecentCert,
} from "@/lib/storage";
import type { CertListItem, QuizLevel } from "@/lib/types";
import { useStored } from "@/lib/use-storage";

function toLevel(value: string | null): QuizLevel {
  return value === "intermediate" || value === "advanced" ? value : "basic";
}

/**
 * 홈 첫 화면의 "바로 5문제 풀기" 큰 버튼.
 * 재방문자는 최근 공부한 자격증으로 클릭 한 번에 시작하고,
 * 풀던 문제가 남아 있으면 "이어서 풀기"가 먼저 나온다.
 */
export function QuickStart({ certs, featuredId }: { certs: CertListItem[]; featuredId: string }) {
  const recent = useStored<RecentCert[]>(STORAGE_KEYS.recent, EMPTY_RECENT);
  const lastLevel = toLevel(useStored<string | null>(STORAGE_KEYS.lastLevel, null));

  const recentCerts = recent
    .map((r) => certs.find((c) => c.id === r.certId))
    .filter((c): c is CertListItem => !!c);
  const recentReady = recentCerts.find((c) => c.ready);
  const target = recentReady ?? certs.find((c) => c.id === featuredId) ?? certs[0];

  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(target.id), null);
  const inProgress = isInProgress(session);
  const startHref = `/cert/${target.id}/quiz?level=${lastLevel}&count=${DEFAULT_QUIZ_COUNT}&subject=all`;
  const others = recentCerts.filter((c) => c.id !== target.id);

  return (
    <section
      aria-labelledby="quick-start-title"
      className="rounded-xl border-2 border-primary bg-primary-soft p-4 sm:p-5"
    >
      <h2 id="quick-start-title" className="text-[1.05rem] font-bold">
        {recentReady ? "최근 공부한 자격증" : "처음이신가요? 이 자격증으로 바로 시작해 보세요"}
      </h2>
      <p className="mt-1 text-2xl font-extrabold">{target.name}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {inProgress ? (
          <>
            <Link href={`/cert/${target.id}/quiz`} className="btn btn-primary btn-lg">
              이어서 풀기 ({session.currentIndex + 1}/{session.questionIds.length}번 문제부터) →
            </Link>
            <Link href={startHref} className="btn btn-lg">
              새로 {DEFAULT_QUIZ_COUNT}문제 풀기 →
            </Link>
          </>
        ) : (
          <Link href={startHref} className="btn btn-primary btn-lg">
            바로 {DEFAULT_QUIZ_COUNT}문제 풀기 →
          </Link>
        )}
        <Link href={`/cert/${target.id}`} className="btn btn-lg">
          출제 분석 보기
        </Link>
      </div>
      <p className="mt-2 text-[0.9rem] text-ink-sub">
        {LEVEL_RULES[lastLevel].label} 문제 {DEFAULT_QUIZ_COUNT}개가 나옵니다. 로그인 없이 바로
        시작하고, 중간에 창을 닫아도 다음에 이어서 풀 수 있습니다.
      </p>

      {others.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="text-[0.95rem] font-bold">최근 본 다른 자격증</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.id}>
                <Link href={`/cert/${c.id}`} className="btn min-h-11 px-3 py-1 text-[0.95rem]">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
