"use client";

import { useState, type ReactNode } from "react";

type TabId = "analysis" | "start";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "analysis", label: "출제 분석" },
  { id: "start", label: "문제 풀기" },
];

/**
 * 자격증 상세의 탭. 두 탭의 내용은 모두 서버에서 HTML 로 그려지고
 * (검색엔진이 읽을 수 있음) 여기서는 보이기/숨기기만 바꾼다.
 */
export function CertTabs({ analysis, start }: { analysis: ReactNode; start: ReactNode }) {
  const [tab, setTab] = useState<TabId>("analysis");

  return (
    <div>
      <div role="tablist" aria-label="자격증 정보" className="grid grid-cols-2 gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`min-h-14 rounded-t-lg border-2 border-b-0 text-lg font-extrabold ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink hover:border-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="panel-analysis"
        aria-labelledby="tab-analysis"
        hidden={tab !== "analysis"}
        className="rounded-b-lg border-2 border-primary bg-surface p-3 sm:p-5"
      >
        {analysis}
        <div className="mt-5 border-t border-line-soft pt-4">
          <button type="button" className="btn btn-primary btn-lg w-full sm:w-auto" onClick={() => setTab("start")}>
            난이도 골라서 문제 풀기 →
          </button>
        </div>
      </div>

      <div
        role="tabpanel"
        id="panel-start"
        aria-labelledby="tab-start"
        hidden={tab !== "start"}
        className="rounded-b-lg border-2 border-primary bg-surface p-3 sm:p-5"
      >
        {start}
      </div>
    </div>
  );
}
