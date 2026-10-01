"use client";

import Link from "next/link";
import { useState } from "react";
import { Stars } from "@/components/Stars";
import type { Subject } from "@/lib/types";

/** 출제 분석 탭: 과목 → 단원 아코디언, 단원마다 중요도 ★ + 출제 비중 막대 + 핵심 요약 */
export function AnalysisPanel({ certId, subjects }: { certId: string; subjects: Subject[] }) {
  const [byImportance, setByImportance] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">과목·단원별 출제 분석</h2>
        <button
          type="button"
          aria-pressed={byImportance}
          onClick={() => setByImportance((v) => !v)}
          className={`btn min-h-11 px-3 py-1 text-[0.95rem] ${byImportance ? "btn-primary" : ""}`}
        >
          {byImportance ? "✓ 중요도 높은 단원이 위로 (켜짐)" : "중요도 높은 단원을 위로 정렬"}
        </button>
      </div>
      <p className="mt-1 text-[0.9rem] text-ink-sub">
        ★이 많을수록 중요한 단원이고, 막대가 길수록 그 과목 안에서 많이 나오는 단원입니다. 단원
        이름을 누르면 핵심 정리를 볼 수 있습니다.
      </p>

      <div className="mt-3 space-y-3">
        {subjects.map((subject, index) => {
          const chapters = byImportance
            ? [...subject.chapters].sort(
                (a, b) => b.importance - a.importance || b.examWeight - a.examWeight,
              )
            : subject.chapters;
          return (
            <details key={subject.id} open={index === 0} className="rounded-lg border-2 border-line">
              <summary className="flex min-h-14 items-center justify-between gap-2 px-3 py-2 sm:px-4">
                <span className="text-lg font-extrabold">
                  {subject.name}
                  <span className="ml-2 text-[0.95rem] font-bold text-ink-sub">
                    시험에서 {subject.questionCount}문항 · 단원 {subject.chapters.length}개
                  </span>
                </span>
                <span className="shrink-0 font-bold text-accent">
                  <span className="when-closed">▼ 펼치기</span>
                  <span className="when-open">▲ 접기</span>
                </span>
              </summary>
              <ul className="px-3 pb-2 sm:px-4">
                {chapters.map((chapter) => (
                  <li key={chapter.id} className="border-t border-line-soft py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <Link href={`/cert/${certId}/${chapter.id}`} className="link text-[1.05rem]">
                        {chapter.name}
                      </Link>
                      <span className="flex items-baseline gap-1.5">
                        <Stars value={chapter.importance} />
                        <span className="text-[0.9rem] font-bold">중요도 {chapter.importance}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div
                        className="h-4 flex-1 overflow-hidden rounded border border-line bg-surface-2"
                        role="img"
                        aria-label={`과목 내 출제 비중 ${chapter.examWeight}%`}
                      >
                        <div className="h-full bg-primary" style={{ width: `${chapter.examWeight}%` }} />
                      </div>
                      <span className="shrink-0 text-[0.9rem] font-bold">
                        출제 비중 {chapter.examWeight}% (약{" "}
                        {Math.max(1, Math.round((subject.questionCount * chapter.examWeight) / 100))}
                        문항)
                      </span>
                    </div>
                    <p className="mt-1.5 text-[0.95rem]">{chapter.summary}</p>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
