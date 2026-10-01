"use client";

import Link from "next/link";
import { EMPTY_NOTES, STORAGE_KEYS, type NoteEntry } from "@/lib/storage";
import { useHydrated, useStored } from "@/lib/use-storage";

/** 상단 "오답노트" 메뉴: 자격증별로 담아 둔 오답 수를 보여 주고 각 오답노트로 보낸다 */
export function NotesIndex({ certs }: { certs: Array<{ id: string; name: string }> }) {
  const hydrated = useHydrated();
  const notes = useStored<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);

  const rows = certs
    .map((c) => ({ ...c, count: notes.filter((n) => n.certId === c.id).length }))
    .filter((c) => c.count > 0);

  if (!hydrated) return <p className="card p-4 font-bold">오답노트를 불러오고 있습니다…</p>;

  if (rows.length === 0) {
    return (
      <div className="card space-y-3 p-5">
        <p className="font-bold">아직 오답노트에 담은 문제가 없습니다.</p>
        <p>문제를 풀고 결과 화면에서 &lsquo;틀린 문제 오답노트에 저장&rsquo;을 누르면 여기에 모입니다.</p>
        <ul className="flex flex-wrap gap-2">
          {certs.map((c) => (
            <li key={c.id}>
              <Link href={`/cert/${c.id}/quiz?level=basic&count=5&subject=all`} className="btn btn-primary btn-lg">
                {c.name} 5문제 풀기 →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((c) => (
        <li key={c.id}>
          <Link
            href={`/cert/${c.id}/notes`}
            className="card flex min-h-16 items-center justify-between gap-3 p-4 hover:border-ink"
          >
            <span className="text-lg font-extrabold">{c.name}</span>
            <span className="font-bold text-accent">틀린 문제 {c.count}개 보기 →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
