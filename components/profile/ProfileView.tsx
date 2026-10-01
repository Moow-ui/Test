"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Fold } from "@/components/Fold";
import { AuthForm } from "@/components/auth/AuthForm";
import { deleteAccount, logout, useAuth } from "@/lib/auth-client";
import { circled } from "@/lib/format";
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

function formatDate(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 프로필: 칭호(보유 자격증), 점수 기록, 내가 푼 문제, 오답, 틀린 핵심 개념, 나만의 오답노트 */
export function ProfileView({ certs }: { certs: ProfileCert[] }) {
  const auth = useAuth();
  const history = useStored<SolveHistoryStore>(STORAGE_KEYS.history, EMPTY_HISTORY);
  const results = useStored<ResultRecord[]>(STORAGE_KEYS.results, EMPTY_RESULTS);
  const notes = useStored<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);
  const owned = useStored<OwnedCert[]>(STORAGE_KEYS.ownedCerts, EMPTY_OWNED);
  const [questions, setQuestions] = useState<Record<string, QuestionBrief>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    return <p className="card p-5 font-bold">불러오는 중…</p>;
  }

  if (auth.status === "guest") {
    return (
      <div className="space-y-4">
        <h1 className="text-center text-2xl font-extrabold">로그인</h1>
        {auth.available ? (
          <AuthForm />
        ) : (
          <p className="card mx-auto max-w-md p-5 font-bold">
            로그인 기능을 준비하고 있습니다. 로그인하지 않아도 문제 풀이와 오답노트는 그대로 쓸 수 있습니다.
          </p>
        )}
        <p className="mx-auto max-w-md text-[0.85rem] text-ink-sub">
          로그인하지 않아도 모든 문제를 풀 수 있습니다. 로그인하면 점수 기록·오답·오답노트가 계정에 저장되어
          다른 기기에서도 이어서 볼 수 있습니다.
        </p>
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
        <p className="text-[0.8rem] font-bold text-[#cbd5e1]">내 정보</p>
        <h1 className="mt-1 text-3xl font-extrabold">
          {user.nickname}
          <span className="ml-2 text-[0.9rem] font-bold text-[#cbd5e1]">@{user.username}</span>
        </h1>

        <div className="mt-4">
          <p className="text-[0.8rem] font-bold text-[#cbd5e1]">칭호 · 보유 자격증 {owned.length}개</p>
          {owned.length === 0 ? (
            <p className="mt-1 text-[0.95rem]">아직 등록한 자격증이 없습니다. 아래에서 딴 자격증을 등록해 보세요.</p>
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
            ["푼 문제", `${solved.length}개`],
            ["정답률", accuracy === null ? "-" : `${accuracy}%`],
            ["시험 본 횟수", `${results.length}회`],
            ["오답노트", `${notes.length}개`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.8rem] font-bold text-[#cbd5e1]">{label}</dt>
              <dd className="text-2xl font-extrabold">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Fold title="딴 자격증 등록하기">
        <OwnedCertManager certs={certs} owned={owned} />
      </Fold>

      <Fold title={`점수 기록 (${results.length})`}>
        {results.length === 0 ? (
          <p>아직 끝까지 푼 시험이 없습니다.</p>
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
                  {r.score}점
                  <span className="ml-1.5 text-[0.85rem] font-bold text-ink-sub">
                    ({r.correct}/{r.total})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Fold>

      <Fold title={`내가 푼 문제 (${solved.length})`}>
        {solved.length === 0 ? (
          <p>아직 푼 문제가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {solved.slice(0, LIST_LIMIT).map(({ id, entry }) => (
              <li key={id} className="border-b border-line-soft pb-2">
                <p className="font-bold">{questions[id]?.stem ?? "문제를 불러오는 중…"}</p>
                <p className="text-[0.85rem] text-ink-sub">
                  <span className={entry.lastCorrect === false ? "font-bold text-bad" : "font-bold text-ok"}>
                    {entry.lastCorrect === false ? "최근 오답" : "최근 정답"}
                  </span>{" "}
                  · 맞힘 {entry.correct}번 · 틀림 {entry.wrong}번 · {formatDate(entry.lastSolvedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {solved.length > LIST_LIMIT && (
          <p className="text-[0.85rem] text-ink-sub">최근에 푼 {LIST_LIMIT}문제만 보여 줍니다.</p>
        )}
      </Fold>

      <Fold title={`내가 틀린 문제 (${wrong.length})`}>
        {wrong.length === 0 ? (
          <p>틀린 문제가 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {wrong.slice(0, LIST_LIMIT).map(({ id, entry }) => {
              const q = questions[id];
              return (
                <li key={id} className="border-b border-line-soft pb-2">
                  <p className="font-bold">{q?.stem ?? "문제를 불러오는 중…"}</p>
                  {q && (
                    <p>
                      <span className="font-bold text-ok">정답 {circled(q.answer)}</span> {q.choices[q.answer - 1]}
                    </p>
                  )}
                  <p className="text-[0.85rem] text-ink-sub">틀림 {entry.wrong}번</p>
                </li>
              );
            })}
          </ul>
        )}
      </Fold>

      <Fold title={`틀린 문제 핵심 개념 (${conceptCount})`}>
        {conceptCount === 0 ? (
          <p>틀린 문제가 없습니다.</p>
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

      <Fold title={`나만의 오답노트 (${notes.length})`}>
        {noteCerts.length === 0 ? (
          <p>
            아직 오답노트에 담은 문제가 없습니다. 시험을 끝낸 뒤 결과 화면에서 &lsquo;틀린 문제 오답노트에
            저장&rsquo;을 누르면 여기에 모입니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {noteCerts.map((c) => (
              <li key={c.id}>
                <Link href={`/cert/${c.id}/notes`} className="btn w-full justify-between">
                  <span>{c.name}</span>
                  <span>{c.count}문제 · 메모하고 인쇄하기 →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Fold>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <button type="button" className="btn" onClick={() => void logout()}>
          로그아웃
        </button>
        <button
          type="button"
          className="text-[0.8rem] font-bold text-ink-sub underline underline-offset-2"
          onClick={() => setConfirmDelete(true)}
        >
          회원 탈퇴
        </button>
      </div>

      {confirmDelete && (
        <div role="alertdialog" aria-labelledby="delete-title" className="rounded-lg border-2 border-bad bg-bad-soft p-4">
          <p id="delete-title" className="font-extrabold">
            정말 탈퇴할까요? 계정과 저장된 기록이 모두 지워지고 되돌릴 수 없습니다.
          </p>
          {message && <p className="mt-1 font-bold text-bad">{message}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const error = await deleteAccount();
                if (error) setMessage(error);
                else setConfirmDelete(false);
              }}
            >
              네, 탈퇴합니다
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setConfirmDelete(false)}>
              아니요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
