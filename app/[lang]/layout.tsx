import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "../globals.css";
import { FontLoader } from "@/components/FontLoader";
import { SyncManager } from "@/components/auth/SyncManager";
import { LOCALES, brandName, getMessages, isLocale } from "@/lib/i18n";
import { homeMeta, toMetadata } from "@/lib/seo";
import { ADSENSE_CLIENT, SITE_URL, SITE_VERIFICATION } from "@/lib/site";
import { DISPLAY_INIT_SCRIPT } from "@/lib/storage";

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

// 언어는 /ko, /en 두 가지만 만든다 (그 밖의 주소는 404)
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    ...toMetadata(lang, homeMeta(lang), { shared: "/" }),
    metadataBase: new URL(SITE_URL),
    applicationName: brandName(lang),
    // 구글·네이버·Bing 소유확인 (값이 있을 때만 태그가 생긴다. lib/site.ts)
    verification: {
      google: SITE_VERIFICATION.google || undefined,
      other: {
        ...(SITE_VERIFICATION.naver ? { "naver-site-verification": SITE_VERIFICATION.naver } : {}),
        ...(SITE_VERIFICATION.bing ? { "msvalidate.01": SITE_VERIFICATION.bing } : {}),
      },
    },
    // 애드센스 사이트 확인 (광고 id 가 있을 때만)
    other: ADSENSE_CLIENT ? { "google-adsense-account": ADSENSE_CLIENT } : undefined,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col antialiased">
        {/* 저장된 테마·글씨 크기를 첫 화면이 그려지기 전에 적용 (깜빡임 방지) */}
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_INIT_SCRIPT }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-bold"
        >
          {m.nav.skip}
        </a>
        {/* 상단 메뉴·하단 안내는 (site)/layout.tsx, 시험 화면은 (exam)/layout.tsx */}
        {children}
        <FontLoader />
        <SyncManager />
      </body>
    </html>
  );
}
