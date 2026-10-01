"use client";

import { useState } from "react";
import {
  EMPTY_REPORTS,
  STORAGE_KEYS,
  clearReports,
  removeReport,
  type ReportEntry,
} from "@/lib/storage";
import { fmt } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";
import { useHydrated, useStored } from "@/lib/use-storage";

function formatTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 문제 오류 신고 목록 (MVP: 이 기기의 localStorage 에 쌓인 신고만 보인다) */
export function ReportsView({ certNames }: { certNames: Record<string, string> }) {
  const hydrated = useHydrated();
  const { m: all } = useMessages();
  const m = all.admin;
  const reasons: Record<string, string> = all.report.reasons;
  const reports = useStored<ReportEntry[]>(STORAGE_KEYS.reports, EMPTY_REPORTS);
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) return <p className="card p-4 font-bold">{m.loading}</p>;

  const json = JSON.stringify(reports, null, 2);

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-warn bg-warn-soft p-3 text-[0.95rem] font-bold">{m.localOnly}</p>

      <p className="font-bold">{fmt(m.count, { n: reports.length })}</p>

      {reports.length === 0 ? (
        <p className="card p-4">{m.none}</p>
      ) : (
        <>
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="card space-y-1 p-3">
                <p className="text-[0.85rem] font-bold text-ink-sub">
                  {formatTime(r.at)} · {certNames[r.certId] ?? r.certId} · {fmt(m.questionId, { id: r.questionId })}
                </p>
                {/* 예전 기록에는 이유가 문장으로 들어 있으므로, 코드가 아니면 그대로 보여 준다 */}
                <p className="font-bold">{reasons[r.reason] ?? r.reason}</p>
                <p className="text-[0.95rem]">{fmt(m.question, { stem: r.stem })}</p>
                {r.memo && <p className="text-[0.95rem]">{fmt(m.memo, { memo: r.memo })}</p>}
                <button
                  type="button"
                  className="btn min-h-11 px-3 py-1 text-[0.9rem]"
                  onClick={() => removeReport(r.id)}
                >
                  {m.done}
                </button>
              </li>
            ))}
          </ul>

          <div className="card space-y-2 p-3">
            <label htmlFor="report-json" className="block font-bold">
              {m.json}
            </label>
            <textarea
              id="report-json"
              readOnly
              rows={8}
              value={json}
              className="w-full rounded-lg border-2 border-line bg-surface p-2 font-mono text-[0.8rem] text-ink"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(json);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? m.copied : m.copy}
              </button>
              {confirmClear ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      clearReports();
                      setConfirmClear(false);
                    }}
                  >
                    {m.yesClear}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => setConfirmClear(false)}>
                    {all.common.no}
                  </button>
                </>
              ) : (
                <button type="button" className="btn" onClick={() => setConfirmClear(true)}>
                  {m.clear}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
