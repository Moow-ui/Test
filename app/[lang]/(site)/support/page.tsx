import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheerSection } from "@/components/support/CheerSection";
import { CopyAccountButton } from "@/components/support/CopyAccountButton";
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
 * 응원하기 (사이트 맨 아래 [응원하기]에서 들어온다).
 * 위: 송금 방법 (계좌번호 복사 · 토스 · 카카오페이. PC 에서는 토스 대신 QR 그림)
 * 아래: 응원 한마디 쓰기와 관리자가 공개한 응원
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

      <section aria-labelledby="pay-title" className="card space-y-4 p-6">
        <h2 id="pay-title" className="text-xl font-bold">
          {m.payTitle}
        </h2>
        <p>{m.payNote}</p>

        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums">
            {fmt(m.account, { bank: SUPPORT.bank[lang], account: SUPPORT.accountDisplay })}
          </p>
          <p className="text-lg">{fmt(m.holder, { holder: SUPPORT.holder })}</p>
        </div>
        <CopyAccountButton value={SUPPORT.accountCopy} />

        {/* 휴대폰: 앱을 바로 여는 버튼. 토스 주소는 토스가 깔린 휴대폰에서만 열려서 PC 에서는 숨긴다 */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href={SUPPORT.tossUrl} className="btn md:hidden">
            {m.toss}
          </a>
          <a href={SUPPORT.kakaoPayUrl} target="_blank" rel="noopener noreferrer" className="btn">
            {m.kakaoPay}
          </a>
        </div>

        {/* PC: 휴대폰 카메라로 찍는 QR 그림 */}
        <div className="hidden space-y-2 md:block">
          <p className="font-bold">{m.qrHint}</p>
          <div className="flex gap-6">
            {[
              { src: SUPPORT.tossQr, label: m.tossQr },
              { src: SUPPORT.kakaoPayQr, label: m.kakaoPayQr },
            ].map((qr) => (
              <figure key={qr.src} className="text-center">
                <div className="rounded-lg border border-card-line bg-figure-bg p-2">
                  {/* 작은 SVG 라 next/image 의 최적화가 필요 없다 */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr.src} alt={qr.label} width={160} height={160} />
                </div>
                <figcaption className="mt-2 font-bold">{qr.label}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <CheerSection />

      <p>
        <Link href={localePath(lang)} className="link">
          {m.back}
        </Link>
      </p>
    </div>
  );
}
