"use client";

/**
 * 개념서 "인쇄·PDF로 저장" 버튼. 브라우저 인쇄 창을 연다 (PDF 파일을 따로 만들지 않는다:
 * 같은 내용의 PDF 가 검색에 따로 잡혀 중복이 되지 않게, 늘 지금 페이지 그대로 인쇄되게).
 * 인쇄할 때 메뉴·버튼·광고는 숨겨진다 (globals.css 의 .no-print).
 */
export function PrintButton({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="no-print mt-4 space-y-2">
      <button type="button" onClick={() => window.print()} className="btn btn-lg">
        {label}
      </button>
      <p className="text-sm text-ink-sub">{hint}</p>
    </div>
  );
}
