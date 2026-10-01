"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Fold } from "@/components/Fold";
import { AuthForm, errorText } from "@/components/auth/AuthForm";
import { deleteAccount, logout, useAuth } from "@/lib/auth-client";
import { circled, formatDate } from "@/lib/format";
import { fmt, localePath } from "@/lib/i18n";
import {
  EMPTY_HISTORY,
  EMPTY_NOTES,
  EMPTY_OWNED,
  EMPTY_RESULTS,
  STORAGE_KEYS,
  type NoteEntry,
  type OwnedCert,
  type ResultRecord,
  type SolveHistoryStore,
} from "@/lib/storage";
import { useMessages } from "@/lib/use-messages";
import { useStored } from "@/lib/use-storage";
import { OwnedCertManager, TitleBadge } from "./OwnedCerts";

export interface ProfileCert {
  id: string;
  name: string;
  grade: string;
  ready: boolean;
}

/** /api/questions/{certId} 가 내려 주는 문제 요약 */
interface QuestionBrief {
  id: string;
  stem: string;
  choices: string[];
  answer: number;
  oneLineConcept: string;
}

const LIST_LIMIT = 50;


/** 프로필: 칭호(보유 자격증), 점수 기록, 내가 푼 문제, 오답, 틀린 핵심 개념, 나만의 오답노트 */
export function ProfileView({ certs }: { certs: ProfileCert[] }) {
  const auth = useAuth();
  const { locale, m: all } = useMessages();
  const m = all.profile;
  const history = useStored<SolveHistoryStore>(STORAGE_KEYS.history, EMPTY_HISTORY);
  const results = useStored<ResultRecord[]>(STORAGE_KEYS.results, EMPTY_RESULTS);
  const notes = useStored<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);
  const owned = useStored<OwnedCert[]>(STORAGE_KEYS.ownedCerts, EMPTY_OWNED);
  const [questions, setQuestions] = useState<Record<string, QuestionBrief>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const readyCerts = certs.filter((c) => c.ready);
  const certName = (id: string) => certs.find((c) => c.id === id)?.name ?? id;

  /** 풀이 기록의 문제가 어느 자격증 것인지 (예전 기록에는 certId 가 없어 문제 id 앞부분으로 찾는다) */
  const certOf = (questionId: string): string | null =>
    history[questionId]?.certId ?? readyCerts.find((c) => questionId.startsWith(c.id))?.id ?? null;

  const neededCerts = Array.from(
    new Set(
      Object.keys(history)
        .map(certOf)
        .filter((id): id is string => !!id),
    ),
  )
    .sort()
    .join(",");

  // 내가 푼 문제가 있는 자격증의 문제 내용만 불러온다
  useEffect(() => {
    if (auth.status !== "user" || neededCerts === "") return;
    let cancelled = false;
    for (const certId of neededCerts.split(",")) {
      fetch(`/api/questions/${certId}`)
        .then((r) => (r.ok ? (r.json() as Promise<QuestionBrief[]>) : []))
        .then((list) => {
          if (cancelled) return;
          setQuestions((prev) => ({ ...prev, ...Object.fromEntries(list.map((q) => [q.id, q])) }));
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [auth.status, neededCerts]);

  if (auth.status === "loading") {
    return <p className="card p-5 font-bold">{m.loading}</p>;
  }

  if (auth.status === "guest") {
    return (
      <div className="space-y-4">
        <h1 className="text-center text-2xl font-extrabold">{all.auth.login}</h1>
        {auth.available ? <AuthForm /> : <p className="card mx-auto max-w-md p-5 font-bold">{m.unavailable}</p>}
        <p className="mx-auto max-w-md text-[0.85rem] text-ink-sub">{m.guestHint}</p>
      </div>
    );
  }

  const user = auth.user!;
  const solved = Object.entries(history)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => b.entry.lastSolvedAt - a.entry.lastSolvedAt);
  const wrong = solved.filter(({ entry }) => entry.wrong > 0);
  const totalAttempts = solved.reduce((sum, { entry }) => sum + entry.correct + entry.wrong, 0);
  const totalCorrect = solved.reduce((sum, { entry }) => sum + entry.correct, 0);
  const accuracy = totalAttempts === 0 ? null : Math.round((totalCorrect / totalAttempts) * 100);

  // 틀린 문제의 핵심 개념만, 자격증별로 겹치지 않게
  const concepts = new Map<string, string[]>();
  for (const { id } of wrong) {
    const q = questions[id];
    const certId = certOf(id);
    if (!q || !certId) continue;
    const list = concepts.get(certId) ?? [];
    if (!list.includes(q.oneLineConcept)) list.push(q.oneLineConcept);
    concepts.set(certId, list);
  }
  const conceptCount = [...concepts.values()].reduce((sum, list) => sum + list.length, 0);

  const noteCerts = readyCerts
    .map((c) => ({ ...c, count: notes.filter((n) => n.certId === c.id).length }))
    .filter((c) => c.count > 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* ───── 이름과 칭호 ───── */}
      <section className="rounded-2xl border-2 border-[#1e3a8a] bg-[#0f172a] p-5 text-white sm:p-6">
        <p className="text-[0.8rem] font-bold text-[#cbd5e1]">{all.nav.profile}</p>
        <h1 className="mt-1 text-3xl font-extrabold">
          {user.nickname}
          <span className="ml-2 text-[0.9rem] font-bold text-[#cbd5e1]">@{user.username}</span>
        </h1>

        <div className="mt-4">
          <p className="text-[0.8rem] font-bold text-[#cbd5e1]">{fmt(m.titles, { n: owned.length })}</p>
          {owned.length === 0 ? (
            <p className="mt-1 text-[0.95rem]">{m.noOwned}</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {owned.map((cert) => (
                <li key={cert.key}>
                  <TitleBadge cert={cert} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#334155] pt-4 sm:grid-cols-4">
          {[
            [m.stats.solved, fmt(m.countItems, { n: solved.length })],
            [m.stats.accuracy, accuracy === null ? "-" : `${accuracy}%`],
            [m.stats.exams, fmt(m.countTimes, { n: results.length })],
            [m.stats.notes, fmt(m.countItems, { n: notes.length })],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.8rem] font-bold text-[#cbd5e1]">{label}</dt>
              <dd className="text-2xl font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Fold title={m.register}>
        <OwnedCertManager certs={certs} owned={owned} />
      </Fold>

      <Fold title={fmt(m.results, { n: results.length })}>
        {results.length === 0 ? (
          <p>{m.noResults}</p>
        ) : (
          <ul className="space-y-2">
            {results.slice(0, LIST_LIMIT).map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-line-soft pb-2">
                <span>
                  <span className="font-bold">{certName(r.certId)}</span>
                  <span className="ml-2 text-[0.85rem] text-ink-sub">
                    {r.label} · {formatDate(r.at)}
                  </span>
                </span>
                <span className="font-extrabold">
                  {fmt(m.resultScore, { n: r.score })}
                  <span className="ml-1.5 text-[0.85rem] font-bold text-ink-sub">
                    ({r.correct}/{r.total})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Fold>

      <Fold title={fmt(m.solved, { n: solved.length })}>
        {solved.length === 0 ? (
          <p>{m.noSolved}</p>
        ) : (
          <ul className="space-y-2">
            {solved.slice(0, LIST_LIMIT).map(({ id, entry }) => (
              <li key={id} className="border-b border-line-soft pb-2">
                <p className="font-bold">{questions[id]?.stem ?? m.questionLoading}</p>
                <p className="text-[0.85rem] text-ink-sub">
                  <span className={entry.lastCorrect === false ? "font-bold text-bad" : "font-bold text-ok"}>
                    {entry.lastCorrect === false ? m.lastWrong : m.lastCorrect}
                  </span>{" "}
                  ·{" "}
                  {fmt(m.solvedStat, {
                    correct: entry.correct,
                    wrong: entry.wrong,
                    date: formatDate(entry.lastSolvedAt),
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
        {solved.length > LIST_LIMIT && (
          <p className="text-[0.85rem] text-ink-sub">{fmt(m.recentOnly, { n: LIST_LIMIT })}</p>
        )}
      </Fold>

      <Fold title={fmt(m.wrong, { n: wrong.length })}>
        {wrong.length === 0 ? (
          <p>{m.noWrong}</p>
        ) : (
          <ul className="space-y-3">
            {wrong.slice(0, LIST_LIMIT).map(({ id, entry }) => {
              const q = questions[id];
              return (
                <li key={id} className="border-b border-line-soft pb-2">
                  <p className="font-bold">{q?.stem ?? m.questionLoading}</p>
                  {q && (
                    <p>
                      <span className="font-bold text-ok">
                        {all.common.answer} {circled(q.answer)}
                      </span>{" "}
                      {q.choices[q.answer - 1]}
                    </p>
                  )}
                  <p className="text-[0.85rem] text-ink-sub">{fmt(m.wrongTimes, { n: entry.wrong })}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Fold>

      <Fold title={fmt(m.concepts, { n: conceptCount })}>
        {conceptCount === 0 ? (
          <p>{m.noWrong}</p>
        ) : (
          [...concepts.entries()].map(([certId, list]) => (
            <div key={certId}>
              <h3 className="font-extrabold">{certName(certId)}</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-6">
                {list.map((concept) => (
                  <li key={concept} className="font-bold">
                    {concept}
                  </li>
                ))}
              </ol>
            </div>
          ))
        )}
      </Fold>

      <Fold title={fmt(m.myNotes, { n: notes.length })}>
        {noteCerts.length === 0 ? (
          <p>{m.noNotes}</p>
        ) : (
          <ul className="space-y-2">
            {noteCerts.map((c) => (
              <li key={c.id}>
                <Link href={localePath(locale, `/cert/${c.id}/notes`)} className="btn w-full justify-between">
                  <span>{c.name}</span>
                  <span>{fmt(m.noteLink, { n: c.count })}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Fold>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button type="button" className="btn" onClick={() => void logout()}>
          {m.logout}
        </button>
        <button
          type="button"
          className="text-[0.8rem] font-bold text-ink-sub underline underline-offset-2"
          onClick={() => setConfirmDelete(true)}
        >
          {m.delete}
        </button>
      </div>

      {confirmDelete && (
        <div role="alertdialog" aria-labelledby="delete-title" className="rounded-lg border-2 border-bad bg-bad-soft p-4">
          <p id="delete-title" className="font-extrabold">
            {m.confirmDelete}
          </p>
          {errorCode && <p className="mt-1 font-bold text-bad">{errorText(all, errorCode)}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const error = await deleteAccount();
                if (error) setErrorCode(error);
                else setConfirmDelete(false);
              }}
            >
              {m.yesDelete}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setConfirmDelete(false)}>
              {all.common.no}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
