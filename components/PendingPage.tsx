import Link from "next/link";
import { getMessages, localePath, type Locale } from "@/lib/i18n";

/** 아직 내용이 없는 메뉴 페이지(질문 & 답변 · 공지사항)의 공통 화면: 제목 + 안내 한 줄 + 이동 링크 */
export function PendingPage({ locale, kind }: { locale: Locale; kind: "qna" | "notice" }) {
  const m = getMessages(locale).pending;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold sm:text-2xl">{m[kind].title}</h1>
      <p className="card p-6 text-ink-sub">{m[kind].body}</p>
      <p className="flex flex-wrap gap-x-6 gap-y-2 font-bold">
        {kind === "qna" && (
          <Link href={localePath(locale, "/contact")} className="link">
            {m.contactLink}
          </Link>
        )}
        <Link href={localePath(locale)} className="link">
          {m.homeLink}
        </Link>
      </p>
    </div>
  );
}
