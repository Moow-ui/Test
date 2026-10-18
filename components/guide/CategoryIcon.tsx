import type { GuideCategory } from "@/lib/types";

/** 분류마다 다른 그림(선 그림)과 바탕색. 글 목록 오른쪽의 작은 네모(사진 자리)와 글 머리에 쓴다 */
const ICON: Record<GuideCategory, string> = {
  schedule: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5M8 14h3M13 14h3M8 17h3",
  "pass-guide": "M5 21V4M5 4h11l-2 4 2 4H5",
  change: "M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4",
  "exam-tips": "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  career: "M3 8h18v12H3zM9 8V5h6v3M3 13h18",
  concept: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7M8 11h5",
};

const TONE: Record<GuideCategory, string> = {
  schedule: "bg-lv-basic-soft text-lv-basic-ink",
  "pass-guide": "bg-primary-soft text-accent",
  change: "bg-lv-adv-soft text-lv-adv-ink",
  "exam-tips": "bg-lv-mid-soft text-lv-mid-ink",
  career: "bg-ok-soft text-ok",
  concept: "bg-lv-cbt-soft text-lv-cbt-ink",
};

export function CategoryIcon({ category, size = 24 }: { category: GuideCategory; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON[category]} />
    </svg>
  );
}

/** 글 목록 오른쪽의 네모 (블로그 목록의 사진 자리) */
export function CategoryTile({ category, className = "" }: { category: GuideCategory; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl ${TONE[category]} ${className}`} aria-hidden="true">
      <CategoryIcon category={category} size={36} />
    </span>
  );
}
