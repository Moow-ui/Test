"use client";

import { useState } from "react";
import { REPORT_REASONS, addReport } from "@/lib/storage";
import type { Question } from "@/lib/types";

/** 문제 오류 신고 (MVP: 이 기기의 localStorage 에 기록. /admin/reports 에서 확인) */
export function ReportForm({ question, onClose }: { question: Question; onClose: () => void }) {
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div role="status" className="mt-3 rounded-lg border-2 border-ok bg-ok-soft p-3">
        <p className="font-bold">신고가 저장되었습니다. 알려 주셔서 고맙습니다.</p>
        <button type="button" className="btn mt-2" onClick={onClose}>
          닫기
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-3 space-y-3 rounded-lg border-2 border-line bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        addReport({
          certId: question.certId,
          questionId: question.id,
          stem: question.stem.slice(0, 80),
          reason,
          memo: memo.trim(),
        });
        setDone(true);
      }}
    >
      <p className="font-bold">이 문제에서 무엇이 이상한가요?</p>
      <div>
        <label htmlFor="report-reason" className="block font-bold">
          이유
        </label>
        <select
          id="report-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 h-12 w-full rounded-lg border-2 border-line bg-surface px-2 text-ink"
        >
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="report-memo" className="block font-bold">
          자세한 내용 (안 써도 됩니다)
        </label>
        <textarea
          id="report-memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          maxLength={500}
          className="mt-1 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary">
          신고 저장하기
        </button>
        <button type="button" className="btn" onClick={onClose}>
          취소
        </button>
      </div>
    </form>
  );
}
