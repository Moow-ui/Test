import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { DisplayControls } from "./DisplayControls";

/** 글씨 크기 설정과 상관없이 높이가 일정하도록 헤더 안은 px 단위를 쓴다 */
export function Header() {
  return (
    <header className="no-print border-b border-line-soft bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="text-[21px] font-extrabold tracking-tight text-accent">
            {SITE_NAME}
          </Link>
          <Link
            href="/notes"
            className="text-[15px] font-bold text-ink underline underline-offset-4 sm:text-[16px]"
          >
            오답노트
          </Link>
        </div>
        <DisplayControls />
      </div>
    </header>
  );
}
