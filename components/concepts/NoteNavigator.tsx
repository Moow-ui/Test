"use client";

import { useEffect, useRef, useState } from "react";
import { fmt } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";

export interface NavChapter {
  id: string;
  /** "1-1. 보호구와 안전표지" */
  label: string;
  /** "1과목 · 안전관리" */
  subject: string;
}

/**
 * 개념 정리 "요약 노트" 맨 위에 붙는 막대 (요약 노트 영역 안에서만 화면 위에 붙어 있다).
 * 지금 읽고 있는 단원 이름과 위치(3/12, 진행 막대)를 보여 주고, 누르면 단원 목록이 펼쳐져 원하는 단원으로 바로 간다.
 * 움직이는 효과 없음. 휴대폰 사파리는 주소창이 아래에 있어서 위에 붙인다.
 */
export function NoteNavigator({ chapters }: { chapters: NavChapter[] }) {
  const { m } = useMessages();
  const t = m.concepts;
  const barRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  // 지금 단원 = 막대 바로 아래를 지나간 마지막 단원
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      // 단원으로 바로 가면 단원 제목이 막대 아래 약 20px 에 온다 (ConceptNote 의 scroll-mt-24). 여유를 두고 40px
      const line = (barRef.current?.getBoundingClientRect().bottom ?? 0) + 40;
      let index = 0;
      chapters.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= line) index = i;
      });
      setCurrent(index);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [chapters]);

  // 목록이 열려 있으면 Esc 로 닫는다
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (chapters.length === 0) return null;
  const now = chapters[current];
  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div ref={barRef} className="no-print sticky top-0 z-30 -mx-4 bg-bg px-4 pb-2 pt-2 sm:mx-0 sm:px-0">
      <div className="card overflow-hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="note-nav-list"
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-primary-soft"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-ink-sub">
              {t.navNow} · {now.subject}
            </span>
            <span className="block truncate font-bold">{now.label}</span>
          </span>
          <span className="shrink-0 text-sm font-bold tabular-nums text-ink-sub">
            {fmt(t.navPosition, { n: current + 1, total: chapters.length })}
          </span>
          <span className="shrink-0 rounded-lg bg-surface-2 px-3 py-2 text-sm font-bold">
            {open ? t.navClose : t.navOpen}
          </span>
        </button>
        {/* 진행 막대: 전체 단원 중 어디쯤인지 */}
        <div aria-hidden="true" className="h-1 bg-surface-2">
          <div className="h-full bg-primary" style={{ width: `${((current + 1) / chapters.length) * 100}%` }} />
        </div>

        {open && (
          <nav id="note-nav-list" aria-label={t.navOpen} className="max-h-[60vh] overflow-y-auto border-t border-card-line">
            <ol>
              {chapters.map((c, i) => {
                const firstOfSubject = i === 0 || chapters[i - 1].subject !== c.subject;
                const active = i === current;
                return (
                  <li key={c.id}>
                    {firstOfSubject && (
                      <p className="bg-surface-2 px-4 py-2 text-sm font-bold text-ink-sub">{c.subject}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => go(c.id)}
                      aria-current={active ? "location" : undefined}
                      className={`flex min-h-12 w-full items-center px-4 text-left font-bold hover:bg-primary-soft ${
                        active ? "bg-primary-soft text-accent" : "text-ink"
                      }`}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}
