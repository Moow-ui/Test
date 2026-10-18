import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PendingPage } from "@/components/PendingPage";
import { LOCALES, getMessages, isLocale } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// 내용이 생길 때까지 검색에서 제외(noindex)하고 sitemap 에도 넣지 않는다
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.notice, "/notice", { shared: "/notice" });
}

/** 공지사항 (준비 중인 빈 페이지. 메뉴에서 들어온다) */
export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <PendingPage locale={lang} kind="notice" />;
}
