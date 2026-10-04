"use client";

import Link from "next/link";
import { localePath, type Locale } from "@/lib/i18n";
import { STORAGE_KEYS, dismissCookieNotice } from "@/lib/storage";
import { useMessages } from "@/lib/use-messages";
import { useHydrated, useStored } from "@/lib/use-storage";

/** 배너를 띄우는 언어. 그 밖의 언어는 하단 안내(Footer)의 한 줄 고지만 보여 준다 */
const BANNER_LOCALES: readonly Locale[] = ["en"];

/**
 * 쿠키 사용 안내 배너 (화면 아래에 붙는다).
 * "확인"을 누르면 이 기기에 기억해 다시 띄우지 않는다. 시험 화면에는 넣지 않는다 (아래 버튼 줄을 가린다).
 */
export function CookieNotice() {
  const { locale, m: all } = useMessages();
  const m = all.cookie;
  const hydrated = useHydrated();
  const dismissed = useStored<boolean>(STORAGE_KEYS.cookieNotice, false);

  if (!BANNER_LOCALES.includes(locale) || !hydrated || dismissed) return null;

  return (
    <aside aria-label={m.label} className="no-print sticky bottom-0 z-40 border-t border-line-soft bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-4 text-sm">
        <p>
          {m.text}{" "}
          <Link href={localePath(locale, "/privacy")} className="link">
            {m.more}
          </Link>
        </p>
        <button type="button" className="btn btn-primary" onClick={dismissCookieNotice}>
          {m.ok}
        </button>
      </div>
    </aside>
  );
}
