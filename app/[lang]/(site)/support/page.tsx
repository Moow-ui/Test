import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheerForm, PublicCheers } from "@/components/support/Cheers";
import { CopyAccountButton } from "@/components/support/CopyAccountButton";
import { SupportBox } from "@/components/support/SupportBox";
import { SUPPORT } from "@/config/support";
import { LOCALES, brandName, fmt, getMessages, isLocale, localePath } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

/** 송금 앱으로 넘어가는 큰 버튼. 색은 각 앱의 색 (토스 파랑·흰 글씨, 카카오 노랑·검은 글씨: 둘 다 대비 4.5:1 이상) */
const PAY_BUTTON =
  "flex min-h-16 w-full items-center justify-center gap-2 rounded-xl px-6 text-xl font-bold shadow-sm hover:opacity-90 focus-visible:outline-4 focus-visible:outline-offset-2 sm:w-auto sm:min-w-80";

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
 * 응원하기 (사이트 맨 아래 [응원하기]에서 들어온다).
 * 제목·소개 아래에 상자 4개(계좌번호 보기 · 토스로 보내기 · 카카오페이로 보내기 · 응원 메시지 남기기).
 * 상자를 누르면 내용이 열린다 (2026-11-07 회장 결정). 그 아래에 관리자가 공개한 응원
 */
export default async function SupportPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang).support;
  const brand = brandName(lang);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{fmt(m.title, { brand })}</h1>
      <p className="text-lg">{fmt(m.intro, { brand })}</p>

      <div className="space-y-3">
        {/* 1. 계좌번호 */}
        <SupportBox title={m.accountBox}>
          <p>{m.payNote}</p>
          <div className="space-y-1">
            <p className="text-2xl font-bold tabular-nums">
              {fmt(m.account, { bank: SUPPORT.bank[lang], account: SUPPORT.accountDisplay })}
            </p>
            <p className="text-lg">{fmt(m.holder, { holder: SUPPORT.holder })}</p>
          </div>
          <CopyAccountButton value={SUPPORT.accountCopy} />
        </SupportBox>

        {/* 2. 토스: 누르면 토스 앱의 송금 화면이 바로 열린다 (토스가 깔린 휴대폰에서만) */}
        <SupportBox title={m.tossBox}>
          <a href={SUPPORT.tossUrl} className={`${PAY_BUTTON} bg-[#0064ff] text-white`}>
            {m.tossOpen}
          </a>
          <p className="text-ink-sub">{m.tossHint}</p>
        </SupportBox>

        {/* 3. 카카오페이: 누르면 카카오페이 송금 화면으로 넘어간다 */}
        <SupportBox title={m.kakaoPayBox}>
          <a href={SUPPORT.kakaoPayUrl} target="_blank" rel="noopener noreferrer" className={`${PAY_BUTTON} bg-[#fee500] text-[#191919]`}>
            {m.kakaoPayOpen}
          </a>
        </SupportBox>

        {/* 4. 응원 메시지 (비공개로 저장, 관리자가 고른 것만 아래 "받은 응원"에 보인다) */}
        <SupportBox title={m.messageBox}>
          <CheerForm />
        </SupportBox>
      </div>

      <PublicCheers />

      <p>
        <Link href={localePath(lang)} className="link">
          {m.back}
        </Link>
      </p>
    </div>
  );
}
