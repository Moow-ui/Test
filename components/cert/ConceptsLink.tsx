"use client";

import { useEffect } from "react";
import { ANALYSIS_ANCHOR } from "@/components/cert/anchors";
import { useMessages } from "@/lib/use-messages";

/** 접힌 출제 분석을 펼치고 그 위치로 바로 이동한다 (애니메이션 없이) */
function openAnalysis(): boolean {
  const el = document.getElementById(ANALYSIS_ANCHOR);
  if (!(el instanceof HTMLDetailsElement)) return false;
  el.open = true;
  el.scrollIntoView({ block: "start" });
  el.querySelector("summary")?.focus({ preventScroll: true });
  return true;
}

/**
 * 실전 문제풀이 바로 아래의 얇은 한 줄 링크: "풀기 전에 단원별 핵심 개념 먼저 보기 →".
 * 문제 박스보다 눈에 덜 띄게 연한 배경·작은 글씨로 둔다.
 * 개념 정리 페이지가 있으면(href) 그 페이지로 가고, 없으면 같은 페이지의 출제 분석을 펼친다.
 */
export function ConceptsLink({ href }: { href?: string }) {
  const { m } = useMessages();

  // 주소가 #analysis 로 열리면(단원 페이지의 "출제 분석으로 돌아가기") 출제 분석을 펼쳐 둔다
  useEffect(() => {
    if (window.location.hash === `#${ANALYSIS_ANCHOR}`) openAnalysis();
  }, []);

  return (
    <a
      href={href ?? `#${ANALYSIS_ANCHOR}`}
      onClick={(e) => {
        if (href || !openAnalysis()) return;
        e.preventDefault();
        history.replaceState(null, "", `#${ANALYSIS_ANCHOR}`);
      }}
      className="flex min-h-11 items-center justify-center rounded-lg bg-surface-2 px-4 py-2 text-center text-sm font-bold leading-snug text-ink-sub hover:underline"
    >
      {m.cert.conceptsFirst}
    </a>
  );
}
