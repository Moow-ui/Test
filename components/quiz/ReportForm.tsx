"use client";

import { useState } from "react";
import { errorText } from "@/components/auth/AuthForm";
import { sendReport } from "@/lib/report-client";
import { REPORT_MEMO_MAX, REPORT_REASONS, REPORT_STEM_MAX, type ReportReason } from "@/lib/report-rules";
import type { Question } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** 문제 오류 신고: 서버에 저장되고 관리자 화면(/admin)에서 본다. 로그인 없이 보낼 수 있다 */
export function ReportForm({ question, onClose }: { question: Question; onClose: () => void }) {
  const { m: all } = useMessages();
  const m = all.report;
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div role="status" className="mt-4 rounded-lg bg-ok-soft p-4">
        <p className="font-bold">{m.saved}</p>
        <button type="button" className="btn mt-2" onClick={onClose}>
          {all.common.close}
        </button>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    const code = await sendReport({
      certId: question.certId,
      questionId: question.id,
      stem: question.stem.slice(0, REPORT_STEM_MAX),
      reason,
      memo: memo.trim(),
    });
    setBusy(false);
    if (code) setError(code);
    else setDone(true);
  };

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="font-bold">{m.ask}</p>
      <div>
        <label htmlFor="report-reason" className="block font-bold">
          {m.reason}
        </label>
        <select
          id="report-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          className="mt-2 h-12 w-full rounded-lg border-2 border-line bg-surface px-2 text-ink"
        >
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {m.reasons[r]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="report-memo" className="block font-bold">
          {m.memo}
        </label>
        <textarea
          id="report-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          maxLength={REPORT_MEMO_MAX}
          className="mt-2 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-bad-soft p-2 font-bold">
          {errorText(all, error)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {m.submit}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          {all.common.cancel}
        </button>
      </div>
    </form>
  );
}
