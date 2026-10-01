"use client";

import Link from "next/link";
import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { QuestionBadges } from "@/components/quiz/QuestionBadges";
import { circled } from "@/lib/format";
import {
  EMPTY_NOTES,
  STORAGE_KEYS,
  clearNotes,
  removeNote,
  setNoteMemo,
  type NoteEntry,
} from "@/lib/storage";
import type { Question, Subject } from "@/lib/types";
import { useHydrated, useStored } from "@/lib/use-storage";

/** 자격증별 오답노트: 틀린 문제 + 정답 + 해설, 인쇄(흑백 기준), 다시 풀기 */
export function NotesView({
  cert,
  questions,
}: {
  cert: { id: string; name: string; subjects: Subject[] };
  questions: Question[];
}) {
  const hydrated = useHydrated();
  const allNotes = useStored<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);
  const [confirmClear, setConfirmClear] = useState(false);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const notes = allNotes
    .filter((n) => n.certId === cert.id)
    .map((n) => ({ note: n, question: byId.get(n.questionId) }))
    .filter((x): x is { note: NoteEntry; question: Question } => !!x.question);

  const locationOf = (q: Question) => {
    const subject = cert.subjects.find((s) => s.id === q.subjectId);
    const chapter = subject?.chapters.find((c) => c.id === q.chapterId);
    return `${subject?.name ?? ""} › ${chapter?.name ?? ""}`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="no-print text-[0.9rem] font-bold text-ink-sub">
          <Link href={`/cert/${cert.id}`} className="link">
            ← {cert.name} 페이지
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">
          {cert.name} 오답노트 {hydrated && `(${notes.length}문제)`}
        </h1>
        <p className="print-only text-[0.9rem]">큐패스 오답노트 · 정답과 해설 포함</p>
      </header>

      {!hydrated ? (
        <p className="card p-4 font-bold">오답노트를 불러오고 있습니다…</p>
      ) : notes.length === 0 ? (
        <div className="card space-y-3 p-5">
          <p className="font-bold">아직 오답노트에 담은 문제가 없습니다.</p>
          <p>
            문제를 풀고 결과 화면에서 &lsquo;틀린 문제 오답노트에 저장&rsquo;을 누르면 여기에 모입니다.
          </p>
          <Link href={`/cert/${cert.id}/quiz?level=basic&count=5&subject=all`} className="btn btn-primary btn-lg">
            바로 5문제 풀기 →
          </Link>
        </div>
      ) : (
        <>
          <div className="no-print grid gap-2 sm:grid-cols-3">
            <Link href={`/cert/${cert.id}/quiz?mode=notes`} className="btn btn-primary btn-lg">
              오답 다시 풀기 →
            </Link>
            <button type="button" className="btn btn-lg" onClick={() => window.print()}>
              🖨 인쇄하기
            </button>
            <button type="button" className="btn btn-lg" onClick={() => setConfirmClear(true)}>
              오답노트 비우기
            </button>
          </div>
          <p className="no-print text-[0.9rem] text-ink-sub">
            인쇄하면 문제·정답·해설이 흑백으로 깔끔하게 나옵니다. 오답노트는 이 기기(브라우저)에만
            저장됩니다.
          </p>

          {confirmClear && (
            <div role="alertdialog" aria-labelledby="clear-title" className="no-print rounded-lg border-2 border-bad bg-bad-soft p-4">
              <p id="clear-title" className="font-extrabold">
                {cert.name} 오답노트 {notes.length}문제를 모두 지울까요?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    clearNotes(cert.id);
                    setConfirmClear(false);
                  }}
                >
                  네, 모두 지웁니다
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setConfirmClear(false)}>
                  아니요
                </button>
              </div>
            </div>
          )}

          <ol className="space-y-4">
            {notes.map(({ note, question: q }, i) => (
              <li key={q.id} className="card print-avoid-break p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-extrabold">{i + 1}.</span>
                  <span className="no-print flex flex-wrap gap-1.5">
                    <QuestionBadges question={q} />
                  </span>
                  <span className="text-[0.85rem] font-bold text-ink-sub">{locationOf(q)}</span>
                </div>
                <h2 className="mt-1 text-lg font-bold leading-normal">{q.stem}</h2>
                <ol className="mt-2 space-y-1">
                  {q.choices.map((choice, ci) => {
                    const n = ci + 1;
                    return (
                      <li key={n} className={n === q.answer ? "font-extrabold" : ""}>
                        {circled(n)} {choice}
                        {n === q.answer && <span className="ml-2 text-ok">← 정답</span>}
                        {n === note.chosen && n !== q.answer && (
                          <span className="ml-2 font-bold text-bad">← 내가 고른 답</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 border-t border-line-soft pt-2">
                  <span className="font-bold">핵심:</span> {q.oneLineConcept}
                </p>
                <div className="mt-2 text-[0.95rem]">
                  <Markdown text={q.explanation} />
                </div>
                {/* 나만의 오답노트: 내가 직접 적는 메모 (칸을 벗어나면 저장된다) */}
                <div className="mt-3">
                  <label htmlFor={`memo-${q.id}`} className="no-print block text-[0.9rem] font-bold">
                    내 메모
                  </label>
                  <textarea
                    id={`memo-${q.id}`}
                    key={note.memo ?? ""}
                    defaultValue={note.memo ?? ""}
                    onBlur={(e) => {
                      if (e.target.value.trim() !== (note.memo ?? "")) setNoteMemo(q.id, e.target.value);
                    }}
                    rows={2}
                    maxLength={500}
                    placeholder="헷갈린 이유, 외우는 방법 등을 적어 두세요"
                    className="no-print mt-1 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink placeholder:text-ink-sub"
                  />
                  {note.memo && (
                    <p className="print-only mt-1">
                      <span className="font-bold">내 메모:</span> {note.memo}
                    </p>
                  )}
                </div>
                <div className="no-print mt-3">
                  <button
                    type="button"
                    className="btn min-h-11 px-3 py-1 text-[0.9rem]"
                    onClick={() => removeNote(q.id)}
                  >
                    이 문제는 이제 알아요 (오답노트에서 빼기)
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
