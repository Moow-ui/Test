import Link from "next/link";
import { getCertList } from "@/lib/data";
import { brandName, getMessages, localeCountry, localePath, type Locale } from "@/lib/i18n";
import { LogoMark } from "./LogoMark";
import { SideMenu } from "./SideMenu";
import { TopBar } from "./TopBar";
import { HeaderAccount } from "./auth/HeaderAccount";

/**
 * 일반 화면의 상단 막대: 메뉴 버튼 · 사이트 이름 · 오답노트 · 로그인 / (오른쪽) 글자 크기 · 어둡게
 * 휴대폰에서는 자리가 모자라 "어둡게" 를 메뉴 안으로 옮긴다 (themeInMenu).
 */
export async function Header({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  // 메뉴의 "최근 공부한 자격증" 이름을 보여 주려고 이 나라의 풀 수 있는 자격증 id·이름만 넘긴다
  const certs = (await getCertList(localeCountry(locale)))
    .filter((c) => c.ready)
    .map((c) => ({ id: c.id, name: c.name }));
  return (
    <TopBar themeInMenu>
      <SideMenu certs={certs} />
      <Link
        href={localePath(locale)}
        className="inline-flex min-h-11 items-center gap-2 text-[18px] font-bold tracking-tight text-accent sm:text-[22px]"
      >
        <LogoMark size={28} />
        {brandName(locale)}
      </Link>
      <Link href={localePath(locale, "/notes")} className="link-quiet hidden font-bold text-ink sm:inline">
        {m.nav.notes}
      </Link>
      <HeaderAccount />
    </TopBar>
  );
}
