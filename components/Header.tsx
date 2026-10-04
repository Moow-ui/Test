import Link from "next/link";
import { brandName, getMessages, localePath, type Locale } from "@/lib/i18n";
import { TopBar } from "./TopBar";
import { HeaderAccount } from "./auth/HeaderAccount";

/** 일반 화면의 상단 막대: 사이트 이름 · 오답노트 · 로그인 / (오른쪽) 글자 크기 · 어둡게 */
export function Header({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <TopBar>
      <Link href={localePath(locale)} className="text-[22px] font-bold tracking-tight text-accent">
        {brandName(locale)}
      </Link>
      <Link href={localePath(locale, "/notes")} className="hidden font-bold text-ink underline underline-offset-4 sm:inline">
        {m.nav.notes}
      </Link>
      <HeaderAccount />
    </TopBar>
  );
}
