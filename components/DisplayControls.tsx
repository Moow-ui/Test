"use client";

import { FONT_SCALES, setFontScale, setTheme } from "@/lib/storage";
import { useFontScale, useTheme } from "@/lib/use-storage";

const SAMPLE_SIZE: Record<string, string> = {
  md: "text-[15px]",
  lg: "text-[18px]",
  xl: "text-[21px]",
};

/** 상단에 항상 보이는 글씨 크기 3단계 + 어둡게/밝게 버튼 */
export function DisplayControls() {
  const font = useFontScale();
  const theme = useTheme();

  return (
    <div className="flex items-center gap-2">
      <div
        role="group"
        aria-label="글씨 크기"
        className="flex items-center gap-1 text-[15px] font-semibold"
      >
        <span className="hidden sm:inline">글씨 크기</span>
        <span className="sm:hidden">글씨</span>
        {FONT_SCALES.map((scale) => {
          const active = font === scale.value;
          return (
            <button
              key={scale.value}
              type="button"
              onClick={() => setFontScale(scale.value)}
              aria-pressed={active}
              aria-label={`글씨 ${scale.label}`}
              title={`글씨 ${scale.label}`}
              className={`flex h-10 w-9 items-center justify-center rounded-md border-2 font-bold ${SAMPLE_SIZE[scale.value]} ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-surface text-ink hover:border-ink"
              }`}
            >
              가
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-10 rounded-md border-2 border-line bg-surface px-2 text-[15px] font-bold text-ink hover:border-ink"
      >
        {theme === "dark" ? "밝게" : "어둡게"}
      </button>
    </div>
  );
}
