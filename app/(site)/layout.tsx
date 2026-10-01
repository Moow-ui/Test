import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/** 일반 화면: 상단 메뉴 + 본문 + 하단 안내 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:py-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
