"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** 방금 인쇄 창을 연 것이 이 버튼인지 (아니면 브라우저 메뉴·Ctrl+P) */
let fromButton = false;

/**
 * 개념서 "인쇄·PDF로 저장" 버튼. 브라우저 인쇄 창을 연다 (PDF 파일을 따로 만들지 않는다:
 * 같은 내용의 PDF 가 검색에 따로 잡혀 중복이 되지 않게, 늘 지금 페이지 그대로 인쇄되게).
 * 인쇄할 때 메뉴·버튼·광고는 숨겨진다 (globals.css 의 .no-print).
 */
export function PrintButton({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="no-print mt-4 space-y-2">
      <button
        type="button"
        onClick={() => {
          fromButton = true;
          window.print();
        }}
        className="btn btn-lg"
      >
        {label}
      </button>
      <p className="text-sm text-ink-sub">{hint}</p>
    </div>
  );
}

/**
 * 개념 정리 페이지에서 인쇄 창이 열리면 통계 이벤트 concepts_print 를 보낸다.
 * 버튼이 없는 자격증(내용 다듬기 전)도 브라우저 메뉴로 인쇄하면 세므로, 모든 개념 정리 페이지에 둔다.
 * page: 개념서 전체(book)·단원(chapter) / has_button: 그 페이지에 인쇄 버튼이 있는지 / via: 버튼인지 브라우저 메뉴인지
 */
export function PrintTracker({
  certId,
  page,
  hasButton,
}: {
  certId: string;
  page: "book" | "chapter";
  hasButton: boolean;
}) {
  useEffect(() => {
    const onPrint = () => {
      track("concepts_print", {
        cert_id: certId,
        page,
        has_button: hasButton ? "yes" : "no",
        via: fromButton ? "button" : "browser",
      });
      fromButton = false;
    };
    window.addEventListener("beforeprint", onPrint);
    return () => window.removeEventListener("beforeprint", onPrint);
  }, [certId, page, hasButton]);
  return null;
}
