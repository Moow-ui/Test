/**
 * 문제 풀이·실전 CBT 화면: 실제 시험장 화면처럼 사이트 메뉴와 하단 안내 없이 시험 화면만 보여 준다.
 * (글자 크기 조절과 나가기는 시험 화면 안에 있다)
 */
export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex flex-1 flex-col">
      {children}
    </main>
  );
}
