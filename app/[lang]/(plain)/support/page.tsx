import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoMark } from "@/components/LogoMark";
import { CheerForm, PublicCheers } from "@/components/support/Cheers";
import { CopyAccountButton } from "@/components/support/CopyAccountButton";
import { LinkButton, OpenButton } from "@/components/support/SupportButtons";
import { SUPPORT } from "@/config/support";
import { LOCALES, brandName, fmt, getMessages, isLocale, localePath } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// 송금 안내라 검색에 나올 내용이 아니다: noindex 로 두고 sitemap 에도 넣지 않는다
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.support, "/support", { shared: "/support" });
}

/**
 * 응원하기 (사이트 맨 아래 [응원하기]에서 들어온다). 링크 모음 페이지 모양 (2026-11-07 회장 결정):
 * 로고·이름·소개 한 줄 아래에 큰 버튼 4개.
 * - 토스·카카오페이: 누르면 바로 그 앱의 송금 화면으로 넘어간다
 * - 계좌번호 보기·응원 메시지 남기기: 누르면 버튼 바로 아래에 내용이 열린다
 * 그 아래에 관리자가 공개한 응원.
 */
export default async function SupportPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang).support;
  const brand = brandName(lang);

  return (
    <div className="w-full max-w-xl space-y-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <Link href={localePath(lang)} aria-label={fmt(m.back, { brand })} className="rounded-3xl">
          <LogoMark size={96} />
        </Link>
        <h1 className="text-3xl font-bold">{fmt(m.title, { brand })}</h1>
        <p className="text-lg">{fmt(m.intro, { brand })}</p>
      </header>

      <div className="space-y-4">
        <OpenButton title={m.accountBox}>
          <p>{m.payNote}</p>
          <div className="space-y-1">
            <p className="text-lg font-bold">{SUPPORT.bank[lang]}</p>
            <p className="whitespace-nowrap text-3xl font-bold tabular-nums">{SUPPORT.accountDisplay}</p>
            <p className="text-lg">{fmt(m.holder, { holder: SUPPORT.holder })}</p>
          </div>
          <CopyAccountButton value={SUPPORT.accountCopy} />
        </OpenButton>

        {/* 토스 앱의 송금 화면을 바로 연다 (토스가 깔린 휴대폰에서만) */}
        <LinkButton href={SUPPORT.tossUrl} title={m.tossBox} note={m.tossHint} />
        <LinkButton href={SUPPORT.kakaoPayUrl} title={m.kakaoPayBox} external />

        <OpenButton title={m.messageBox}>
          <CheerForm />
        </OpenButton>
      </div>

      <PublicCheers />

      <p className="text-center">
        <Link href={localePath(lang)} className="link font-bold">
          {fmt(m.back, { brand })}
        </Link>
      </p>
    </div>
  );
}
