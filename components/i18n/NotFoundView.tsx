"use client";

import Link from "next/link";
import { localePath } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";

/** 없는 주소 안내 (not-found 는 주소의 언어를 넘겨받지 못하므로 화면에서 읽는다) */
export function NotFoundView() {
  const { locale, m } = useMessages();
  return (
    <div className="card mx-auto my-6 w-[calc(100%-2rem)] max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-bold">{m.notFound.title}</h1>
      <p>{m.notFound.text}</p>
      <Link href={localePath(locale)} className="btn btn-primary btn-lg">
        {m.notFound.button}
      </Link>
    </div>
  );
}
