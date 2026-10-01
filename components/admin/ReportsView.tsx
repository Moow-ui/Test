"use client";

import { useState } from "react";
import {
  EMPTY_REPORTS,
  STORAGE_KEYS,
  clearReports,
  removeReport,
  type ReportEntry,
} from "@/lib/storage";
import { useHydrated, useStored } from "@/lib/use-storage";

function formatTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 문제 오류 신고 목록 (MVP: 이 기기의 localStorage 에 쌓인 신고만 보인다) */
export function ReportsView({ certNames }: { certNames: Record<string, string> }) {
  const hydrated = useHydrated();
  const reports = useStored<ReportEntry[]>(STORAGE_KEYS.reports, EMPTY_REPORTS);
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) return <p className="card p-4 font-bold">신고 목록을 불러오고 있습니다…</p>;

  const json = JSON.stringify(reports, null, 2);

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-warn bg-warn-soft p-3 text-[0.95rem]">
        지금은 로그인·서버 저장이 없어서 <strong>이 기기(브라우저)에서 접수된 신고만</strong> 보입니다.
        다른 사용자의 신고를 모으려면 나중에 Supabase 같은 서버 저장소로 옮겨야 합니다.
      </p>

      <p className="font-bold">신고 {reports.length}건</p>

      {reports.length === 0 ? (
        <p className="card p-4">접수된 신고가 없습니다.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="card space-y-1 p-3">
                <p className="text-[0.85rem] font-bold text-ink-sub">
                  {formatTime(r.at)} · {certNames[r.certId] ?? r.certId} · 문제 id: {r.questionId}
                </p>
                <p className="font-bold">{r.reason}</p>
                <p className="text-[0.95rem]">문제: {r.stem}…</p>
                {r.memo && <p className="text-[0.95rem]">메모: {r.memo}</p>}
                <button
                  type="button"
                  className="btn min-h-11 px-3 py-1 text-[0.9rem]"
                  onClick={() => removeReport(r.id)}
                >
                  처리 완료 (목록에서 지우기)
                </button>
              </li>
            ))}
          </ul>

          <div className="card space-y-2 p-3">
            <label htmlFor="report-json" className="block font-bold">
              전체 신고 내용 (JSON)
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
                {copied ? "✔ 복사했습니다" : "JSON 복사하기"}
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
                    네, 모두 지웁니다
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => setConfirmClear(false)}>
                    아니요
                  </button>
                </>
              ) : (
                <button type="button" className="btn" onClick={() => setConfirmClear(true)}>
                  신고 모두 지우기
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
