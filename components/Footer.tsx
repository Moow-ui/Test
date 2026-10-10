import Link from "next/link";
import { INFO_PAGE_IDS } from "@/content/pages";
import { getCertList } from "@/lib/data";
import { brandName, fmt, getMessages, localeCountry, localePath, type Locale } from "@/lib/i18n";
import { LocaleSwitch } from "./i18n/LocaleSwitch";

/**
 * 모든 일반 화면 맨 아래의 안내.
 * 맨 끝: 자격증 추가 기록 링크(작게). 그 위 두 줄: 그 나라에 지금 수록된 예상문제 수(빌드할 때 데이터에서 센 실제 값, 출제 중단 문제 제외)와 저작권 표시.
 */
export async function Footer({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const brand = brandName(locale);
  const total = (await getCertList(localeCountry(locale))).reduce((sum, c) => sum + c.questionCount, 0);
  return (
    <footer className="cv no-print mt-12 border-t border-line-soft bg-surface">
      <div className="mx-auto w-full max-w-5xl space-y-2 px-4 py-6 text-sm text-ink-sub">
        <p className="font-bold text-ink">
          {brand} · {m.site.tagline}
        </p>
        <p>{m.site.notice}</p>
        <p>{m.site.officialInfo}</p>
        <nav aria-label={m.nav.footerMenu} className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
          <Link href={localePath(locale)} className="link">
            {m.nav.certList}
          </Link>
          <Link href={localePath(locale, "/notes")} className="link">
            {m.nav.notes}
          </Link>
          {/* 아주 좁은 휴대폰(360px)에서는 상단 막대에 로그인 자리가 없어 여기에도 둔다 */}
          <Link href={localePath(locale, "/profile")} className="link">
            {m.nav.profile}
          </Link>
          <LocaleSwitch />
        </nav>
        <nav aria-label={m.nav.legalMenu} className="flex flex-wrap gap-x-4 gap-y-2">
          {INFO_PAGE_IDS.map((id) => (
            <Link key={id} href={localePath(locale, `/${id}`)} className="link">
              {m.nav[id]}
            </Link>
          ))}
        </nav>
        <p>{m.site.cookieNotice}</p>
        <p className="pt-2 font-bold text-ink">
          {fmt(m.site.questionTotal, { n: total.toLocaleString(locale === "ko" ? "ko-KR" : "en-US") })}
        </p>
        <p>{fmt(m.site.copyright, { year: new Date().getFullYear(), brand })}</p>
        {/* 자격증 추가 기록. 운영자 확인용이라 아주 작게 둔다 */}
        <p className="text-xs">
          <Link href={localePath(locale, "/log")} className="link">
            {m.nav.addedLog}
          </Link>
        </p>
      </div>
    </footer>
  );
}
