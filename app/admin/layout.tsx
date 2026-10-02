import "../globals.css";

/**
 * 관리자 화면의 틀. 언어 경로(/ko, /en) 밖에 있고 어디에서도 링크하지 않는다.
 * 잠금은 Cloudflare Access + 토큰 검증 (lib/server/access.ts).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col antialiased">
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
