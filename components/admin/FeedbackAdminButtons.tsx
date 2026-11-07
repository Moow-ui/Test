"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setFeedbackState } from "@/lib/cheer-client";

const buttonClass = "btn min-h-11 px-4 py-2 text-sm";

/** 개선 의견 처리 완료 / 처리 전으로 / 삭제. 삭제는 한 번 더 묻는다. 문구는 서버 화면(app/admin/page.tsx)이 넘겨준다 */
export function FeedbackAdminButtons({
  id,
  resolved,
  labels,
}: {
  id: string;
  resolved: boolean;
  labels: { done: string; undo: string; delete: string; deleteConfirm: string; cancel: string; failed: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const run = async (action: "done" | "undo" | "delete") => {
    setBusy(true);
    const ok = await setFeedbackState(id, action);
    setBusy(false);
    setConfirming(false);
    setFailed(!ok);
    if (ok) router.refresh();
  };

  if (confirming) {
    return (
      <div role="alertdialog" aria-label={labels.deleteConfirm} className="flex flex-wrap items-center gap-2">
        <span className="font-bold">{labels.deleteConfirm}</span>
        <button type="button" disabled={busy} className={`${buttonClass} btn-primary`} onClick={() => void run("delete")}>
          {labels.delete}
        </button>
        <button type="button" disabled={busy} className={buttonClass} onClick={() => setConfirming(false)}>
          {labels.cancel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} className={buttonClass} onClick={() => void run(resolved ? "undo" : "done")}>
        {resolved ? labels.undo : labels.done}
      </button>
      <button type="button" disabled={busy} className={buttonClass} onClick={() => setConfirming(true)}>
        {labels.delete}
      </button>
      {failed && (
        <span role="alert" className="font-bold text-bad">
          {labels.failed}
        </span>
      )}
    </div>
  );
}
