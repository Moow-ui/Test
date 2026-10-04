"use client";

import { useEffect, useRef } from "react";
import { fmt } from "@/lib/i18n";
import { ADSENSE_CLIENT, SHOW_AD_SLOTS } from "@/lib/site";
import { useMessages } from "@/lib/use-messages";

const SCRIPT_ID = "adsbygoogle-js";

/** 애드센스 스크립트는 광고 자리가 있는 화면에서만, 한 번만 불러온다 (시험 화면에는 광고가 뜨지 않게) */
function loadAdsense(client: string): void {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  document.head.appendChild(script);
}

/**
 * 광고 자리 (구글 애드센스).
 *
 * NEXT_PUBLIC_ADSENSE_ID 가 없으면 아무것도 그리지 않는다.
 * (NEXT_PUBLIC_SHOW_AD_SLOTS=1 이면 광고 대신 자리만 점선 상자로 보여 준다)
 *
 * 배치 원칙: 선지 버튼·"다음 문제" 버튼과 붙여 놓지 않는다 (잘못 누르기 방지).
 * 그래서 위쪽 여백(mt-16)을 크게 두고, 목록 하단(홈)과 결과 화면 하단에만 놓는다. 시험 화면에는 넣지 않는다.
 */
export function AdSlot({ position }: { position: string }) {
  const m = useMessages().m.ad;
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    pushed.current = true;
    loadAdsense(ADSENSE_CLIENT);
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      (w.adsbygoogle = w.adsbygoogle ?? []).push({});
    } catch {
      // 광고 차단 프로그램 등으로 실패해도 화면은 그대로 둔다
    }
  }, []);

  if (ADSENSE_CLIENT) {
    return (
      <aside aria-label={m.label} data-ad-position={position} className="no-print mx-auto mt-16 w-full max-w-3xl">
        <p className="text-center text-sm text-ink-sub">{m.label}</p>
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: 100 }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </aside>
    );
  }

  if (!SHOW_AD_SLOTS) return null;
  return (
    <aside
      aria-label={m.label}
      data-ad-position={position}
      className="no-print mx-auto mt-16 flex min-h-[100px] w-full max-w-3xl items-center justify-center rounded-lg bg-surface-2 text-sm text-ink-sub"
    >
      {fmt(m.slot, { position })}
    </aside>
  );
}
