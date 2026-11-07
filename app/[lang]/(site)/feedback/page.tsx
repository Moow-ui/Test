import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { LOCALES, getMessages, isLocale, localePath } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// 의견 보내는 양식이라 검색에 나올 내용이 아니다: noindex 로 두고 sitemap 에도 넣지 않는다
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.feedback, "/feedback", { shared: "/feedback" });
}

/** 개선 의견 (왼쪽 메뉴 "개선 의견"). 보낸 의견은 공개하지 않고 관리자 화면에서만 읽는다 */
export default async function FeedbackPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang).feedback;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{m.title}</h1>
      <p className="text-lg">{m.intro}</p>
      <p className="rounded-lg bg-surface-2 p-4">{m.questionTip}</p>
      <FeedbackForm />
      <p className="flex flex-wrap gap-x-6 gap-y-2 font-bold">
        <Link href={localePath(lang, "/contact")} className="link">
          {m.contactLink}
        </Link>
        <Link href={localePath(lang)} className="link">
          {m.back}
        </Link>
      </p>
    </div>
  );
}
