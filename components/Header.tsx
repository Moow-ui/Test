import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { DisplayControls } from "./DisplayControls";
import { HeaderAccount } from "./auth/HeaderAccount";

/** 글씨 크기 설정과 상관없이 높이가 일정하도록 헤더 안은 px 단위를 쓴다 */
export function Header() {
  return (
    <header className="no-print bg-header">
      <div className="mx-auto flex h-[56px] w-full max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex shrink-0 items-center gap-3 whitespace-nowrap sm:gap-5">
          <Link href="/" className="text-[21px] font-extrabold tracking-tight text-white">
            {SITE_NAME}
          </Link>
          <Link
            href="/notes"
            className="hidden text-[16px] font-bold text-white underline underline-offset-4 sm:inline"
          >
            오답노트
          </Link>
          <HeaderAccount />
        </div>
        <DisplayControls />
      </div>
    </header>
  );
}
