"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setCheerState } from "@/lib/cheer-client";

const buttonClass = "btn min-h-11 px-4 py-2 text-sm";

/** 응원 공개 / 비공개로 되돌리기 / 삭제. 삭제는 한 번 더 묻는다. 문구는 서버 화면(app/admin/page.tsx)이 넘겨준다 */
export function CheerAdminButtons({
  id,
  isPublic,
  labels,
}: {
  id: string;
  isPublic: boolean;
  labels: { publish: string; unpublish: string; delete: string; deleteConfirm: string; cancel: string; failed: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const run = async (action: "publish" | "unpublish" | "delete") => {
    setBusy(true);
    const ok = await setCheerState(id, action);
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
      <button
        type="button"
        disabled={busy}
        className={`${buttonClass} ${isPublic ? "" : "btn-primary"}`}
        onClick={() => void run(isPublic ? "unpublish" : "publish")}
      >
        {isPublic ? labels.unpublish : labels.publish}
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
