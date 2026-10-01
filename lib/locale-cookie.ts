import { LOCALE_COOKIE, isLocale, type Locale } from "./i18n";

/**
 * 사용자가 고른 언어를 쿠키에 기억한다 (클라이언트 전용).
 * 루트(/)에 다시 들어오면 app/route.ts 가 이 쿠키를 보고 그 언어로 보낸다.
 */

const ONE_YEAR_SEC = 365 * 24 * 60 * 60;

export function rememberLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SEC}; samesite=lax`;
}

/** 기억해 둔 언어. 고른 적이 없으면 null */
export function readLocaleCookie(): Locale | null {
  const found = document.cookie
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === LOCALE_COOKIE);
  return found && isLocale(found[1]) ? found[1] : null;
}
