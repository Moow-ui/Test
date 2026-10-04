"use client";

import Link from "next/link";
import { useState } from "react";
import { Stars } from "@/components/Stars";
import { fmt, localePath } from "@/lib/i18n";
import type { Subject } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/**
 * 출제 분석: 과목을 가로로 나란히 놓고, 과목마다 "1단원 : 직류회로" 식으로 단원을 보여 준다.
 * 단원 옆에는 중요도 ★ 와 과목 내 출제 비중(%)만 둔다. linkChapters 가 false 면 단원 이름에 링크를 걸지 않는다.
 */
export function AnalysisPanel({
  certId,
  subjects,
  linkChapters = true,
  conceptChapterIds = [],
}: {
  certId: string;
  subjects: Subject[];
  linkChapters?: boolean;
  /** 개념 정리 페이지가 있는 단원. 이 단원 이름은 개념 정리(/concepts/{단원})로, 나머지는 단원 핵심정리로 간다 */
  conceptChapterIds?: string[];
}) {
  const { locale, m } = useMessages();
  const [byImportance, setByImportance] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 단원 이름이 링크라는 것을 알려 주는 안내 (링크가 없는 "준비 중" 자격증에는 두지 않는다) */}
        {linkChapters ? <p className="text-sm font-bold text-ink-sub">{m.cert.analysisHint}</p> : <span />}
        <button
          type="button"
          aria-pressed={byImportance}
          onClick={() => setByImportance((v) => !v)}
          className={`btn min-h-10 px-4 py-2 text-sm ${byImportance ? "btn-primary" : ""}`}
        >
          {byImportance ? m.cert.sortedByImportance : m.cert.sortByImportance}
        </button>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {subjects.map((subject) => {
          // 단원 번호는 원래 순서대로 붙인다 (정렬해도 번호는 바뀌지 않는다)
          const numbered = subject.chapters.map((chapter, i) => ({ chapter, no: i + 1 }));
          const chapters = byImportance
            ? [...numbered].sort(
                (a, b) =>
                  b.chapter.importance - a.chapter.importance || b.chapter.examWeight - a.chapter.examWeight,
              )
            : numbered;
          return (
            <section key={subject.id} className="py-2">
              <h3 className="text-lg font-bold">
                {subject.name}
                <span className="ml-2 text-sm font-bold text-ink-sub">
                  {fmt(m.common.items, { n: subject.questionCount })}
                </span>
              </h3>
              <ol className="mt-2 space-y-4">
                {chapters.map(({ chapter, no }) => {
                  const label = fmt(m.cert.chapterLabel, { no, name: chapter.name });
                  return (
                    <li key={chapter.id}>
                      {linkChapters ? (
                        <Link
                          href={localePath(
                            locale,
                            conceptChapterIds.includes(chapter.id)
                              ? `/cert/${certId}/concepts/${chapter.id}`
                              : `/cert/${certId}/${chapter.id}`,
                          )}
                          className="link"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span className="font-bold">{label}</span>
                      )}
                      <span className="block text-sm">
                        <Stars value={chapter.importance} />
                        <span className="ml-2 font-bold text-ink-sub">
                          {fmt(m.cert.weight, { n: chapter.examWeight })}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
    </div>
  );
}
