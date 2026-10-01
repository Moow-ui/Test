"use client";

import Link from "next/link";
import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { QuestionBadges } from "@/components/quiz/QuestionBadges";
import { circled } from "@/lib/format";
import { fmt, localePath } from "@/lib/i18n";
import {
  EMPTY_NOTES,
  STORAGE_KEYS,
  clearNotes,
  removeNote,
  setNoteMemo,
  type NoteEntry,
} from "@/lib/storage";
import type { Question, Subject } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
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
  const { locale, m: all, brand } = useMessages();
  const m = all.notes;
  const certPath = localePath(locale, `/cert/${cert.id}`);
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
          <Link href={certPath} className="link">
            {fmt(m.backToCert, { name: cert.name })}
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">
          {fmt(m.certTitle, { name: cert.name })} {hydrated && fmt(m.countSuffix, { n: notes.length })}
        </h1>
        <p className="print-only text-[0.9rem]">{fmt(m.printHeader, { brand })}</p>
      </header>

      {!hydrated ? (
        <p className="card p-4 font-bold">{m.loading}</p>
      ) : notes.length === 0 ? (
        <div className="card space-y-3 p-5">
          <p className="font-bold">{m.empty}</p>
          <p>{m.emptyHint}</p>
          <Link href={`${certPath}/quiz?level=basic&count=5&subject=all`} className="btn btn-primary btn-lg">
            {m.start5}
          </Link>
        </div>
      ) : (
        <>
          <div className="no-print grid gap-2 sm:grid-cols-3">
            <Link href={`${certPath}/quiz?mode=notes`} className="btn btn-primary btn-lg">
              {m.retry}
            </Link>
            <button type="button" className="btn btn-lg" onClick={() => window.print()}>
              {m.print}
            </button>
            <button type="button" className="btn btn-lg" onClick={() => setConfirmClear(true)}>
              {m.clear}
            </button>
          </div>
          <p className="no-print text-[0.9rem] text-ink-sub">{m.printHint}</p>

          {confirmClear && (
            <div role="alertdialog" aria-labelledby="clear-title" className="no-print rounded-lg border-2 border-bad bg-bad-soft p-4">
              <p id="clear-title" className="font-extrabold">
                {fmt(m.confirmClear, { name: cert.name, n: notes.length })}
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
                  {m.yesClear}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => setConfirmClear(false)}>
                  {all.common.no}
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
                <h2 className="mt-1 whitespace-pre-wrap text-lg font-bold leading-normal">{q.stem}</h2>
                <ol className="mt-2 space-y-1">
                  {q.choices.map((choice, ci) => {
                    const n = ci + 1;
                    return (
                      <li key={n} className={n === q.answer ? "font-extrabold" : ""}>
                        {circled(n)} {choice}
                        {n === q.answer && <span className="ml-2 text-ok">{all.result.answerMark}</span>}
                        {n === note.chosen && n !== q.answer && (
                          <span className="ml-2 font-bold text-bad">{all.result.myChoiceMark}</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 border-t border-line-soft pt-2">
                  <span className="font-bold">{all.common.keyConcept}</span> {q.oneLineConcept}
                </p>
                <div className="mt-2 text-[0.95rem]">
                  <Markdown text={q.explanation} />
                </div>
                {/* 나만의 오답노트: 내가 직접 적는 메모 (칸을 벗어나면 저장된다) */}
                <div className="mt-3">
                  <label htmlFor={`memo-${q.id}`} className="no-print block text-[0.9rem] font-bold">
                    {m.memo}
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
                    placeholder={m.memoPlaceholder}
                    className="no-print mt-1 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink placeholder:text-ink-sub"
                  />
                  {note.memo && (
                    <p className="print-only mt-1">
                      <span className="font-bold">{m.memoPrint}</span> {note.memo}
                    </p>
                  )}
                </div>
                <div className="no-print mt-3">
                  <button
                    type="button"
                    className="btn min-h-11 px-3 py-1 text-[0.9rem]"
                    onClick={() => removeNote(q.id)}
                  >
                    {m.remove}
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
