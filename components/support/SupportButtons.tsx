import type { ReactNode } from "react";

/**
 * 응원 페이지의 큰 버튼 (링크 모음 페이지 모양). 진한 바탕에 흰 글씨, 가운데 정렬.
 * 색은 화면 모드와 상관없이 같다 (흰 글씨와 대비 12:1 이상).
 */
const BUTTON =
  "flex min-h-16 w-full items-center justify-center rounded-2xl bg-[#2b3036] px-6 py-4 text-center text-xl font-bold text-white shadow-md hover:bg-[#3a4048] focus-visible:outline-4 focus-visible:outline-offset-2";

/** 버튼 앞의 이모지 하나 (꾸밈이라 화면 읽기 프로그램에는 숨긴다) */
function Emoji({ emoji }: { emoji: string }) {
  return (
    <span aria-hidden="true" className="mr-3">
      {emoji}
    </span>
  );
}

/** 누르면 바로 다른 곳(송금 앱)으로 넘어가는 버튼 */
export function LinkButton({
  emoji,
  href,
  title,
  external = false,
}: {
  emoji: string;
  href: string;
  title: string;
  external?: boolean;
}) {
  return (
    <a href={href} className={BUTTON} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      <Emoji emoji={emoji} />
      {title}
    </a>
  );
}

/** 누르면 바로 아래에 내용이 열리는 버튼 (details 그대로라 움직이는 효과가 없다) */
export function OpenButton({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className={`${BUTTON} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        <Emoji emoji={emoji} />
        <span>{title}</span>
        <span aria-hidden="true" className="ml-3 text-base">
          <span className="group-open:hidden">▼</span>
          <span className="hidden group-open:inline">▲</span>
        </span>
      </summary>
      <div className="card mt-2 space-y-4 p-6">{children}</div>
    </details>
  );
}
