/**
 * 단독 화면 (응원하기): 링크 모음 페이지처럼 상단 메뉴·하단 안내 없이 본문만 보여 준다 (2026-11-07 회장 결정).
 * 로고를 누르면 홈으로 간다.
 */
export default function PlainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex flex-1 flex-col items-center px-4 py-10">
      {children}
    </main>
  );
}
