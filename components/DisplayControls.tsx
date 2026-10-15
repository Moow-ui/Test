"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fmt } from "@/lib/i18n";
import { FONT_SCALES, setFontScale, setTheme, type Theme } from "@/lib/storage";
import { useMessages } from "@/lib/use-messages";
import { useFontScale, useTheme } from "@/lib/use-storage";

/** "가" 글자를 단계마다 조금씩 크게 (상단 막대는 글자 크기 설정과 상관없이 px 로 고정) */
const SAMPLE_SIZE: Record<string, string> = {
  md: "text-[16px]",
  lg: "text-[18px]",
  xl: "text-[22px]",
};

const THEMES: Theme[] = ["light", "dark"];

/** 팝오버 안의 선택 버튼. 고른 것은 굵은 테두리로 표시한다 (주황 바탕은 쓰지 않는다) */
function optionClass(active: boolean): string {
  return `flex h-11 min-w-11 items-center justify-center rounded-lg border-2 px-2 font-bold text-ink ${
    active ? "border-ink bg-surface" : "border-transparent bg-surface-2 hover:border-ink-sub"
  }`;
}

/**
 * 화면 설정 버튼("Aa") 하나. 누르면 작은 팝오버가 열리고 그 안에서 글자 크기 3단계와 밝게/어둡게를 고른다.
 * 모든 화면(일반 화면·문제 풀이·결과)의 상단 막대 오른쪽에 같은 모양으로 놓는다 (components/TopBar.tsx).
 * 고른 값은 저장되어 다른 화면·다음 방문에도 그대로다 (lib/storage.ts). 테마는 처음엔 기기 설정을 따른다.
 */
export function DisplayControls() {
  const font = useFontScale();
  const theme = useTheme();
  const m = useMessages().m.display;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // 바깥을 누르거나 Esc 를 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0 whitespace-nowrap">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={m.menu}
        title={m.menu}
        className="flex h-11 min-w-11 items-center justify-center rounded-lg bg-surface-2 px-2 text-[18px] font-bold text-ink hover:bg-line-soft"
      >
        {m.menuIcon}
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={m.menu}
          className="absolute right-0 top-full z-50 mt-2 w-64 space-y-4 rounded-lg border border-card-line bg-surface p-4 text-[16px] text-ink shadow-card"
        >
          <div role="group" aria-label={m.fontSize}>
            <p className="mb-2 font-bold">{m.fontSize}</p>
            <div className="grid grid-cols-3 gap-2">
              {FONT_SCALES.map((scale) => {
                const active = font === scale;
                return (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => setFontScale(scale)}
                    aria-pressed={active}
                    aria-label={fmt(m.fontButton, { size: m.sizes[scale] })}
                    className={`${optionClass(active)} h-auto flex-col py-1`}
                  >
                    <span aria-hidden="true" className={SAMPLE_SIZE[scale]}>
                      {m.sample}
                    </span>
                    <span className="text-[14px]">{m.sizes[scale]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div role="group" aria-label={m.theme}>
            <p className="mb-2 font-bold">{m.theme}</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  aria-pressed={theme === t}
                  className={optionClass(theme === t)}
                >
                  {t === "dark" ? m.dark : m.light}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
