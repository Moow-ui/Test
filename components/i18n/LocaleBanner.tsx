"use client";

import { useState, useSyncExternalStore } from "react";
import { brandName, fmt, getMessages, localePath, pickLocale, type Locale } from "@/lib/i18n";
import { readLocaleCookie, rememberLocale } from "@/lib/locale-cookie";
import { useLocale } from "@/lib/use-messages";

const noopSubscribe = () => () => {};

/** 브라우저 언어가 지금 화면의 언어와 다르고, 아직 언어를 고른 적이 없으면 권할 언어를 돌려준다 */
function suggestedLocale(current: Locale): Locale | null {
  if (readLocaleCookie()) return null;
  const preferred = pickLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
  return preferred === current ? null : preferred;
}

/**
 * 다른 언어 사용자로 보일 때 맨 위에 한 줄만 보여 주는 안내.
 * 강제로 이동시키지 않는다. 어느 쪽을 누르든 고른 언어를 쿠키에 기억해 다시 묻지 않는다.
 * 안내 문구는 권하는 쪽 언어로 쓴다 (그 사람이 읽을 수 있는 말).
 */
export function LocaleBanner() {
  const locale = useLocale();
  const [closed, setClosed] = useState(false);
  const target = useSyncExternalStore(
    noopSubscribe,
    () => suggestedLocale(locale),
    () => null,
  );

  if (!target || closed) return null;
  const m = getMessages(target).banner;

  return (
    <aside aria-label={m.label} className="no-print bg-primary-soft text-ink">
      <p className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2 text-sm font-bold">
        <a
          href={localePath(target)}
          lang={target}
          className="underline underline-offset-2"
          onClick={() => rememberLocale(target)}
        >
          {fmt(m.go, { brand: brandName(target) })}
        </a>
        <button
          type="button"
          lang={target}
          className="underline underline-offset-2"
          onClick={() => {
            rememberLocale(locale);
            setClosed(true);
          }}
        >
          {m.stay}
        </button>
      </p>
    </aside>
  );
}
