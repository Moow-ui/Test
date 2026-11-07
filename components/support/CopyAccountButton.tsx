"use client";

import { useState } from "react";
import { useMessages } from "@/lib/use-messages";

/** 계좌번호 복사 버튼. 복사가 되면 바로 아래에 안내 한 줄을 띄운다 */
export function CopyAccountButton({ value }: { value: string }) {
  const { m: all } = useMessages();
  const m = all.support;
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="space-y-2">
      <button type="button" className="btn btn-primary" onClick={() => void copy()}>
        {m.copy}
      </button>
      <p role="status" className="min-h-6 font-bold">
        {state === "copied" ? m.copied : state === "failed" ? m.copyFailed : ""}
      </p>
    </div>
  );
}
