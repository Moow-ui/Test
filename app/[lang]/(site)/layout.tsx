import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LocaleBanner } from "@/components/i18n/LocaleBanner";
import { isLocale } from "@/lib/i18n";

/** 일반 화면: (다른 언어 안내 한 줄) + 상단 메뉴 + 본문 + 하단 안내 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <LocaleBanner />
      <Header locale={lang} />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:py-6">
        {children}
      </main>
      <Footer locale={lang} />
    </>
  );
}
