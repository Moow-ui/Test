import type { ReactNode } from "react";

/**
 * 응원 페이지의 큰 버튼 (링크 모음 페이지 모양). 진한 바탕에 흰 글씨, 가운데 정렬.
 * 색은 화면 모드와 상관없이 같다 (흰 글씨와 대비 12:1 이상).
 */
const BUTTON =
  "flex min-h-16 w-full items-center justify-center rounded-2xl bg-[#2b3036] px-6 py-4 text-center text-xl font-bold text-white shadow-md hover:bg-[#3a4048] focus-visible:outline-4 focus-visible:outline-offset-2";

/** 누르면 바로 다른 곳(송금 앱)으로 넘어가는 버튼. note 는 버튼 아래의 작은 안내 */
export function LinkButton({
  href,
  title,
  note,
  external = false,
}: {
  href: string;
  title: string;
  note?: string;
  external?: boolean;
}) {
  return (
    <div className="space-y-2">
      <a href={href} className={BUTTON} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {title}
      </a>
      {note && <p className="text-center text-sm text-ink-sub">{note}</p>}
    </div>
  );
}

/** 누르면 바로 아래에 내용이 열리는 버튼 (details 그대로라 움직이는 효과가 없다) */
export function OpenButton({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className={`${BUTTON} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
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
