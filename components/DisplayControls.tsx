"use client";

import { fmt } from "@/lib/i18n";
import { FONT_SCALES, setFontScale, setTheme } from "@/lib/storage";
import { useMessages } from "@/lib/use-messages";
import { useFontScale, useTheme } from "@/lib/use-storage";

/** "가" 글자를 단계마다 조금씩 크게 (상단 막대는 글자 크기 설정과 상관없이 px 로 고정) */
const SAMPLE_SIZE: Record<string, string> = {
  md: "text-[16px]",
  lg: "text-[18px]",
  xl: "text-[22px]",
};

/**
 * 글자 크기 3단계("가 가 가") + 어둡게/밝게 버튼.
 * 모든 화면(일반 화면·문제 풀이·결과)의 상단 막대 오른쪽에 같은 모양으로 놓는다 (components/TopBar.tsx).
 * 고른 값은 저장되어 다른 화면·다음 방문에도 그대로다 (lib/storage.ts). 테마는 처음엔 기기 설정을 따른다.
 */
export function DisplayControls() {
  const font = useFontScale();
  const theme = useTheme();
  const m = useMessages().m.display;

  return (
    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      <div role="group" aria-label={m.fontSize} className="flex items-center text-[16px] font-bold text-ink">
        <span className="mr-2 hidden sm:inline">{m.fontSize}</span>
        <span className="flex rounded-lg bg-surface-2">
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
              className={`flex h-11 w-11 items-center justify-center rounded-lg font-bold ${SAMPLE_SIZE[scale]} ${
                active ? "bg-primary text-white" : "text-ink hover:bg-primary-soft"
              }`}
            >
              {m.sample}
            </button>
          );
        })}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="h-11 rounded-lg bg-surface-2 px-2 text-[16px] font-bold text-ink hover:bg-primary-soft sm:px-4"
      >
        {theme === "dark" ? m.light : m.dark}
      </button>
    </div>
  );
}
