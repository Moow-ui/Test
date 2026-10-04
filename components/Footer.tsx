import Link from "next/link";
import { INFO_PAGE_IDS } from "@/content/pages";
import { brandName, getMessages, localePath, type Locale } from "@/lib/i18n";
import { LocaleSwitch } from "./i18n/LocaleSwitch";

export function Footer({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <footer className="cv no-print mt-12 border-t border-line-soft bg-surface">
      <div className="mx-auto w-full max-w-5xl space-y-2 px-4 py-6 text-sm text-ink-sub">
        <p className="font-bold text-ink">
          {brandName(locale)} · {m.site.tagline}
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
      </div>
    </footer>
  );
}
