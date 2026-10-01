import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { FontLoader } from "@/components/FontLoader";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { DISPLAY_INIT_SCRIPT } from "@/lib/storage";

const naverVerification = process.env.NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | 국가기술자격 필기 기출·예상문제 무료 풀이`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
  },
  twitter: { card: "summary_large_image" },
  // 구글 서치콘솔·네이버 서치어드바이저 소유확인 (환경변수에 값이 있을 때만 태그가 생긴다)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: naverVerification ? { "naver-site-verification": naverVerification } : undefined,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col antialiased">
        {/* 저장된 테마·글씨 크기를 첫 화면이 그려지기 전에 적용 (깜빡임 방지) */}
        <script dangerouslySetInnerHTML={{ __html: DISPLAY_INIT_SCRIPT }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:font-bold"
        >
          본문으로 바로 가기
        </a>
        <Header />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:py-6">
          {children}
        </main>
        <Footer />
        <FontLoader />
      </body>
    </html>
  );
}
