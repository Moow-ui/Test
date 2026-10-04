"use client";

import Link from "next/link";
import { fmt, localePath } from "@/lib/i18n";
import { DEFAULT_QUIZ_COUNT } from "@/lib/quiz-engine";
import {
  EMPTY_RECENT,
  STORAGE_KEYS,
  isInProgress,
  type QuizSession,
  type RecentCert,
} from "@/lib/storage";
import type { CertListItem, QuizLevel } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { useStored } from "@/lib/use-storage";

function toLevel(value: string | null): QuizLevel {
  return value === "intermediate" || value === "advanced" ? value : "basic";
}

/**
 * 홈 검색창 아래 상자.
 * - 최근 공부한 자격증이 있으면: 그 자격증으로 "바로 5문제 풀기"(풀던 문제가 남아 있으면 "이어서 풀기"가 먼저) + 최근 본 다른 자격증.
 * - 기록이 없는 첫 방문이면 그리지 않는다 (사용자 결정 2026-10-04: "많이 찾는 자격증" 상자 삭제).
 */
export function QuickStart({ certs }: { certs: CertListItem[] }) {
  const { locale, m } = useMessages();
  const recent = useStored<RecentCert[]>(STORAGE_KEYS.recent, EMPTY_RECENT);
  const lastLevel = toLevel(useStored<string | null>(STORAGE_KEYS.lastLevel, null));

  // 이 언어(나라)의 자격증만 (다른 나라에서 공부한 기록은 여기에 보이지 않는다)
  const recentCerts = recent
    .map((r) => certs.find((c) => c.id === r.certId))
    .filter((c): c is CertListItem => !!c);
  const recentReady = recentCerts.find((c) => c.ready);
  const target = recentReady ?? certs[0];

  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(target.id), null);
  // 기록이 없는 첫 방문이면 아무것도 그리지 않는다 (P16: "많이 찾는 자격증" 상자는 없앴다)
  if (!recentReady) return null;

  const inProgress = isInProgress(session);
  const certPath = localePath(locale, `/cert/${target.id}`);
  const startHref = `${certPath}/quiz?level=${lastLevel}&count=${DEFAULT_QUIZ_COUNT}&subject=all`;
  const others = recentCerts.filter((c) => c.id !== target.id);

  return (
    <section
      aria-labelledby="quick-start-title"
      className="mx-auto max-w-2xl rounded-2xl bg-primary-soft p-6 text-center"
    >
      <h2 id="quick-start-title" className="text-base font-bold">
        {m.home.recent}
      </h2>
      <p className="mt-2 text-xl font-bold text-accent sm:text-2xl">{target.name}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {inProgress ? (
          <>
            <Link href={`${certPath}/quiz`} className="btn btn-primary btn-lg">
              {fmt(m.home.continue, { current: session.currentIndex + 1, total: session.questionIds.length })}
            </Link>
            <Link href={startHref} className="btn btn-lg">
              {fmt(m.home.startNew, { n: DEFAULT_QUIZ_COUNT })}
            </Link>
          </>
        ) : (
          <Link href={startHref} className="btn btn-primary btn-lg">
            {fmt(m.home.startNow, { n: DEFAULT_QUIZ_COUNT })}
          </Link>
        )}
        <Link href={certPath} className="btn btn-lg">
          {m.home.viewAnalysis}
        </Link>
      </div>
      <p className="mt-2 text-sm text-ink-sub">
        {fmt(m.home.quickNote, { level: m.levels[lastLevel], n: DEFAULT_QUIZ_COUNT })}{" "}
        <span className="text-sm">· {m.home.quickBasis}</span>
      </p>

      {others.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold">{m.home.otherRecent}</h3>
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {others.map((c) => (
              <li key={c.id}>
                <Link href={localePath(locale, `/cert/${c.id}`)} className="btn bg-surface text-sm">
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
