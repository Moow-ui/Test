"use client";

import { useParams } from "next/navigation";
import { DEFAULT_LOCALE, brandName, getMessages, isLocale, type Locale, type Messages } from "./i18n";

/** 지금 화면의 언어 (주소의 /ko, /en) */
export function useLocale(): Locale {
  const lang = useParams<{ lang?: string }>()?.lang;
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** 클라이언트 컴포넌트에서 쓰는 화면 문구. 서버 컴포넌트는 getMessages(locale) 를 쓴다 */
export function useMessages(): { locale: Locale; m: Messages; brand: string } {
  const locale = useLocale();
  return { locale, m: getMessages(locale), brand: brandName(locale) };
}
