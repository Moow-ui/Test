import type { ReactNode } from "react";
import { FoldMark } from "@/components/Fold";

/** 응원 페이지의 상자 하나. 제목을 누르면 내용이 열린다 (움직이는 효과 없음, details 그대로) */
export function SupportBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="card">
      <summary className="flex min-h-16 cursor-pointer items-center justify-between gap-2 px-4 sm:px-6">
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        <span className="shrink-0 font-bold text-accent">
          <FoldMark />
        </span>
      </summary>
      <div className="space-y-4 px-4 pb-6 sm:px-6">{children}</div>
    </details>
  );
}
