"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { INFO_PAGE_IDS } from "@/content/pages";
import { useAuth } from "@/lib/auth-client";
import { localePath } from "@/lib/i18n";
import { EMPTY_RECENT, STORAGE_KEYS, setTheme, type RecentCert } from "@/lib/storage";
import { useMessages } from "@/lib/use-messages";
import { useStored, useTheme } from "@/lib/use-storage";

export interface MenuCert {
  id: string;
  name: string;
}

/** 메뉴 항목 앞의 작은 그림 (선 그림 하나, 글자색을 따른다) */
const ICONS: Record<string, string> = {
  home: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
  list: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  recent: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7v5l3 3",
  notes: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  profile: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c0-4 4-6 8-6s8 2 8 6",
  qna: "M4 5h16v11H9l-5 4zM9 9h6M9 12h4",
  notice: "M4 10v4h3l7 5V5L7 10zM18 9a4 4 0 0 1 0 6",
  log: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  theme: "M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z",
};

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

const ROW = "flex min-h-14 w-full items-center gap-3 rounded-lg px-3 text-[18px] font-bold text-ink hover:bg-primary-soft";

/**
 * 상단 막대 왼쪽의 "메뉴" 버튼 + 누르면 왼쪽에서 나오는 메뉴판 (모든 화면 크기에서 여닫기 방식).
 * - 움직이는 효과 없이 바로 열고 닫는다. 닫기 버튼·바깥(어두운 부분)·Esc·메뉴 안 링크로 닫힌다.
 * - 열려 있는 동안 뒤 화면은 스크롤되지 않는다. 문제 풀이 화면에는 넣지 않는다 (일반 화면 Header.tsx 와 풀이 결과 화면 ResultHeader 에서 쓴다).
 * - certs(자격증 id·이름)를 주지 않으면(풀이 결과 화면) "최근 공부한 자격증" 묶음은 숨긴다.
 * - 휴대폰에서는 상단 막대에 자리가 없어 "어둡게" 버튼을 이 안에 둔다 (PC 는 상단 막대에 그대로 있다).
 */
export function SideMenu({ certs = [] }: { certs?: MenuCert[] }) {
  const { locale, m } = useMessages();
  const t = m.menu;
  const auth = useAuth();
  const theme = useTheme();
  const recent = useStored<RecentCert[]>(STORAGE_KEYS.recent, EMPTY_RECENT);
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  // 이 언어(나라)의 자격증만, 최근 3개
  const recentCerts = recent
    .map((r) => certs.find((c) => c.id === r.certId))
    .filter((c): c is MenuCert => !!c)
    .slice(0, 3);

  useEffect(() => {
    const root = document.documentElement;
    if (open) root.style.overflow = "hidden";
    else root.style.overflow = "";
    return () => {
      root.style.overflow = "";
    };
  }, [open]);

  function show() {
    ref.current?.showModal();
    setOpen(true);
  }
  function hide() {
    ref.current?.close();
  }

  const items: Array<{ icon: string; href: string; label: string }> = [
    { icon: "home", href: localePath(locale), label: t.home },
    { icon: "list", href: `${localePath(locale)}#all-certs`, label: t.certList },
  ];
  const after: Array<{ icon: string; href: string; label: string }> = [
    { icon: "notes", href: localePath(locale, "/notes"), label: t.notes },
    { icon: "profile", href: localePath(locale, "/profile"), label: auth.status === "user" ? t.profile : t.login },
    { icon: "qna", href: localePath(locale, "/qna"), label: t.qna },
    { icon: "notice", href: localePath(locale, "/notice"), label: t.notice },
    { icon: "log", href: localePath(locale, "/log"), label: t.log },
  ];

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={t.openLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-ink hover:bg-primary-soft sm:h-11 sm:w-auto sm:flex-row sm:gap-1 sm:bg-surface-2 sm:px-3"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="text-[11px] font-bold leading-none sm:text-[16px]">{t.open}</span>
      </button>

      <dialog
        ref={ref}
        aria-label={t.title}
        onClose={() => setOpen(false)}
        // 어두운 바깥 부분(= dialog 자체)을 누르면 닫는다. 안쪽 링크를 누르면 이동하면서 닫는다
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) hide();
        }}
        className="m-0 h-dvh max-h-none w-[85vw] max-w-[320px] bg-surface p-0 text-ink backdrop:bg-black/50"
      >
        <div className="flex min-h-full flex-col gap-1 px-3 pb-6">
          <div className="sticky top-0 flex h-16 items-center justify-between bg-surface">
            <p className="px-3 text-[20px] font-bold">{t.title}</p>
            <button type="button" onClick={hide} autoFocus className="btn min-h-11 px-4 text-[16px]">
              ✕ {t.close}
            </button>
          </div>

          <nav aria-label={t.title} className="flex flex-col gap-1">
            {items.map((it) => (
              <Link key={it.icon} href={it.href} className={ROW}>
                <Icon name={it.icon} />
                {it.label}
              </Link>
            ))}

            {recentCerts.length > 0 && (
              <div className="py-1">
                <p className="flex min-h-10 items-center gap-3 px-3 text-[16px] font-bold text-ink-sub">
                  <Icon name="recent" />
                  {t.recent}
                </p>
                <ul>
                  {recentCerts.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={localePath(locale, `/cert/${c.id}`)}
                        className="flex min-h-12 items-center rounded-lg pl-12 pr-3 text-[17px] font-bold text-accent underline underline-offset-4 hover:bg-primary-soft"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {after.map((it) => (
              <Link key={it.icon} href={it.href} className={ROW}>
                <Icon name={it.icon} />
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="mt-2 border-t border-line-soft pt-3">
            {/* 휴대폰에서만: 상단 막대에서 빠진 "어둡게/밝게" */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`${ROW} sm:hidden`}
            >
              <Icon name="theme" />
              {theme === "dark" ? m.display.light : m.display.dark}
            </button>
            <nav aria-label={t.more} className="flex flex-wrap gap-x-4 gap-y-2 px-3 pt-3 text-[15px]">
              {INFO_PAGE_IDS.map((id) => (
                <Link key={id} href={localePath(locale, `/${id}`)} className="link text-ink-sub">
                  {m.nav[id]}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </dialog>
    </>
  );
}
