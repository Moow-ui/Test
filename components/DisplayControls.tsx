"use client";

import { fmt } from "@/lib/i18n";
import { FONT_SCALES, setFontScale, setTheme } from "@/lib/storage";
import { useMessages } from "@/lib/use-messages";
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
  const m = useMessages().m.display;

  return (
    <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-2">
      <div
        role="group"
        aria-label={m.fontSize}
        className="flex items-center gap-1 text-[15px] font-semibold text-white"
      >
        <span className="hidden sm:inline">{m.fontSize}</span>
        <span className="hidden min-[400px]:inline sm:hidden">{m.fontSizeShort}</span>
        {FONT_SCALES.map((scale) => {
          const active = font === scale;
          const label = fmt(m.fontButton, { size: m.sizes[scale] });
          return (
            <button
              key={scale}
              type="button"
              onClick={() => setFontScale(scale)}
              aria-pressed={active}
              aria-label={label}
              title={label}
              className={`flex h-10 w-9 items-center justify-center rounded-md border-2 font-bold ${SAMPLE_SIZE[scale]} ${
                active
                  ? "border-white bg-primary text-white"
                  : "border-transparent bg-surface text-ink hover:border-focus"
              }`}
            >
              {m.sample}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-10 rounded-md border-2 border-transparent bg-surface px-2 text-[15px] font-bold text-ink hover:border-focus"
      >
        {theme === "dark" ? m.light : m.dark}
      </button>
    </div>
  );
}
