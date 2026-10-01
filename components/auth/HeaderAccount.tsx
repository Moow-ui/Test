"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-client";

/** 상단 메뉴의 "로그인" / "내 정보" */
export function HeaderAccount() {
  const auth = useAuth();
  return (
    <Link
      href="/profile"
      className="text-[15px] font-bold text-white underline underline-offset-4 sm:text-[16px]"
    >
      {auth.status === "user" ? "내 정보" : "로그인"}
    </Link>
  );
}
