import Link from "next/link";
import { INFO_PAGE_IDS } from "@/content/pages";
import { getCertList } from "@/lib/data";
import { brandName, fmt, getMessages, localeCountry, localePath, type Locale } from "@/lib/i18n";
import { LocaleSwitch } from "./i18n/LocaleSwitch";
import { LogoMark } from "./LogoMark";

/**
 * 모든 일반 화면 맨 아래의 안내.
 * 위: 사이트 소개(이름·한 줄 소개·수록 문제 수) | 바로가기 | 약관과 안내. 아래: 고지문, 저작권, 자격증 추가 기록 링크(작게).
 * 수록 문제 수는 빌드할 때 데이터에서 센 실제 값(출제 중단 문제 제외).
 */
export async function Footer({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const brand = brandName(locale);
  const total = (await getCertList(localeCountry(locale))).reduce((sum, c) => sum + c.questionCount, 0);
  return (
    <footer className="cv no-print mt-12 border-t border-line-soft bg-surface">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-ink-sub">
        {/* 위: 사이트 소개 | 바로가기 | 약관과 안내 (휴대폰은 위아래로) */}
        <div className="grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-base font-bold text-ink">
              <LogoMark size={22} />
              {brand}
            </p>
            <p>{m.site.tagline}</p>
            <p className="font-bold text-ink">
              {fmt(m.site.questionTotal, { n: total.toLocaleString(locale === "ko" ? "ko-KR" : "en-US") })}
            </p>
          </div>
          <nav aria-label={m.nav.footerMenu}>
            <p className="font-bold text-ink">{m.nav.quickLinks}</p>
            <ul className="mt-2 space-y-1">
              <li>
                <Link href={localePath(locale)} className="link-quiet inline-flex min-h-9 items-center">
                  {m.nav.certList}
                </Link>
              </li>
              <li>
                <Link href={localePath(locale, "/notes")} className="link-quiet inline-flex min-h-9 items-center">
                  {m.nav.notes}
                </Link>
              </li>
              {/* 아주 좁은 휴대폰(360px)에서는 상단 막대에 로그인 자리가 없어 여기에도 둔다 */}
              <li>
                <Link href={localePath(locale, "/profile")} className="link-quiet inline-flex min-h-9 items-center">
                  {m.nav.profile}
                </Link>
              </li>
              <li className="inline-flex min-h-9 items-center">
                <LocaleSwitch />
              </li>
            </ul>
          </nav>
          <nav aria-label={m.nav.legalMenu}>
            <p className="font-bold text-ink">{m.nav.legalMenu}</p>
            <ul className="mt-2 space-y-1">
              {INFO_PAGE_IDS.map((id) => (
                <li key={id}>
                  <Link href={localePath(locale, `/${id}`)} className="link-quiet inline-flex min-h-9 items-center">
                    {m.nav[id]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* 아래: 고지문 (작은 글씨) + 저작권 · 기록 */}
        <div className="mt-8 space-y-2 border-t border-line-soft pt-6">
          <p>{m.site.notice}</p>
          <p>{m.site.officialInfo}</p>
          <p>{m.site.cookieNotice}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p>{fmt(m.site.copyright, { year: new Date().getFullYear(), brand })}</p>
          {/* 자격증 추가 기록. 운영자 확인용이라 작게 둔다 */}
          <Link href={localePath(locale, "/log")} className="link-quiet text-xs">
            {m.nav.addedLog}
          </Link>
        </div>
      </div>
    </footer>
  );
}
