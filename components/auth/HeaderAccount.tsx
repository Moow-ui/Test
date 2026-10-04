"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-client";
import { localePath } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";

/** 상단 메뉴의 "로그인" / "내 정보". 폭 430px 미만에서는 로고 마크 때문에 자리가 없어 숨긴다 (하단 안내에 "내 정보" 링크가 있다) */
export function HeaderAccount() {
  const auth = useAuth();
  const { locale, m } = useMessages();
  return (
    <Link
      href={localePath(locale, "/profile")}
      className="font-bold text-ink underline underline-offset-4 max-[429px]:hidden"
    >
      {auth.status === "user" ? m.nav.profile : m.nav.login}
    </Link>
  );
}
