"use client";

import { LOCALES, brandName, getMessages, localePath } from "@/lib/i18n";
import { rememberLocale } from "@/lib/locale-cookie";
import { useLocale } from "@/lib/use-messages";

/** 하단의 언어 바꾸기: 다른 언어(나라)의 홈으로 보내고, 고른 언어를 쿠키에 기억한다 */
export function LocaleSwitch() {
  const current = useLocale();
  return (
    <>
      {LOCALES.filter((l) => l !== current).map((l) => (
        <a key={l} href={localePath(l)} hrefLang={l} lang={l} className="link" onClick={() => rememberLocale(l)}>
          {getMessages(l).nav.languageName} · {brandName(l)}
        </a>
      ))}
    </>
  );
}
