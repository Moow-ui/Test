"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setReportResolved } from "@/lib/report-client";

/** 신고를 처리 완료 / 처리 전으로 표시하는 버튼. 문구는 서버 화면(app/admin/page.tsx)이 넘겨준다 */
export function ReportStatusButton({
  id,
  resolved,
  labels,
}: {
  id: string;
  resolved: boolean;
  labels: { done: string; undo: string; failed: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = async () => {
    setBusy(true);
    const ok = await setReportResolved(id, !resolved);
    setBusy(false);
    setFailed(!ok);
    if (ok) router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} className="btn min-h-11 px-3 py-1 text-[0.9rem]" onClick={toggle}>
        {resolved ? labels.undo : labels.done}
      </button>
      {failed && (
        <span role="alert" className="font-bold text-bad">
          {labels.failed}
        </span>
      )}
    </div>
  );
}
