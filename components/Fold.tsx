"use client";

import type { ReactNode } from "react";
import { useMessages } from "@/lib/use-messages";

/** "▼ 보기 / ▲ 접기" 표시 (details > summary 안에서 쓴다) */
export function FoldMark() {
  const m = useMessages().m.common;
  return (
    <>
      <span className="when-closed">{m.show}</span>
      <span className="when-open">{m.hide}</span>
    </>
  );
}

/** 눌러야 펼쳐지는 묶음. 접혀 있어도 내용은 HTML 에 들어 있어 검색엔진이 읽을 수 있다 */
export function Fold({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <details id={id} className="card scroll-mt-4">
      <summary className="flex min-h-14 items-center justify-between gap-2 px-4 sm:px-4">
        <h2 className="font-bold">{title}</h2>
        <span className="shrink-0 text-sm font-bold text-accent">
          <FoldMark />
        </span>
      </summary>
      <div className="space-y-2 px-4 pb-4 text-sm">{children}</div>
    </details>
  );
}
