"use client";

import { ANALYSIS_ANCHOR } from "@/components/cert/anchors";
import { useMessages } from "@/lib/use-messages";

/** 접힌 출제 분석을 펼치고 그 위치로 바로 이동한다 (애니메이션 없이) */
export function openAnalysis(): boolean {
  const el = document.getElementById(ANALYSIS_ANCHOR);
  if (!(el instanceof HTMLDetailsElement)) return false;
  el.open = true;
  el.scrollIntoView({ block: "start" });
  el.querySelector("summary")?.focus({ preventScroll: true });
  return true;
}

/**
 * 개념 정리가 없는 자격증: 실전 문제풀이 바로 아래의 얇은 한 줄 링크 "풀기 전에 단원별 핵심정리 먼저 보기 →".
 * 같은 페이지의 출제 분석을 펼친다 (단원 이름 → 단원 핵심정리). 이 경우 "개념 정리"라는 이름은 쓰지 않는다 (P15).
 * 개념 정리가 있는 자격증은 이 줄 대신 CertBoxes 의 "핵심 개념 정리" 카드가 나온다.
 */
export function ConceptsLink() {
  const { m } = useMessages();
  return (
    <a
      href={`#${ANALYSIS_ANCHOR}`}
      onClick={(e) => {
        if (!openAnalysis()) return;
        e.preventDefault();
        history.replaceState(null, "", `#${ANALYSIS_ANCHOR}`);
      }}
      className="flex min-h-11 items-center justify-center rounded-lg bg-surface-2 px-4 py-2 text-center text-sm font-bold leading-snug text-ink-sub hover:underline"
    >
      {m.cert.conceptsFirst}
    </a>
  );
}
