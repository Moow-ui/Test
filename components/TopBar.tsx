import type { ReactNode } from "react";
import { DisplayControls } from "./DisplayControls";

/**
 * 모든 화면 맨 위의 막대 하나: 왼쪽은 화면마다 다르고(사이트 이름·메뉴, 시험 화면은 나가기),
 * 오른쪽은 늘 같은 자리에 글자 크기·어둡게 버튼.
 * 글자 크기 설정과 상관없이 높이가 일정하도록 안쪽은 px 단위를 쓴다.
 */
export function TopBar({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <header className="no-print bg-surface">
      <div
        className={`mx-auto flex h-16 w-full items-center justify-between gap-2 px-3 sm:px-4 ${wide ? "max-w-6xl" : "max-w-5xl"}`}
      >
        <div className="flex min-w-0 items-center gap-4 whitespace-nowrap text-[16px]">{children}</div>
        <DisplayControls />
      </div>
    </header>
  );
}
