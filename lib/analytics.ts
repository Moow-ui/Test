"use client";

import { useEffect, useRef } from "react";

/**
 * 방문 통계 이벤트 (Google Analytics + Microsoft Clarity).
 * 풀이를 얼마나 시작하고 끝내는지, 어느 문제에서 그만두는지를 센다.
 * 보내는 값은 자격증 id·풀이 종류·난이도·문항 수·점수 같은 숫자뿐이다.
 * 회원 정보(아이디·닉네임)와 문제 id·고른 답은 보내지 않는다.
 * 태그가 없으면(개발 서버 등) 아무 일도 하지 않는다.
 */

type Params = Record<string, string | number>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function track(name: string, params: Params): void {
  if (typeof window === "undefined") return;
  try {
    // beacon: 페이지를 닫는 순간에 보내도 빠지지 않게
    window.gtag?.("event", name, { ...params, transport_type: "beacon" });
    // Clarity 는 이벤트 이름만 받는다 (녹화를 이 이벤트로 골라 볼 수 있다)
    window.clarity?.("event", name);
  } catch {
    // 통계가 실패해도 풀이에는 영향을 주지 않는다
  }
}

/**
 * 풀이 도중에 화면을 떠나면(다른 페이지로 이동, 창 닫기) 한 번 보낸다.
 * params 가 null 이면(풀이가 끝났거나 시작 전) 보내지 않는다.
 */
export function useTrackLeave(name: string, params: Params | null): void {
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  });
  useEffect(() => {
    let sent = false;
    const send = () => {
      if (sent || !latest.current) return;
      sent = true;
      track(name, latest.current);
    };
    window.addEventListener("pagehide", send);
    return () => {
      window.removeEventListener("pagehide", send);
      send();
    };
  }, [name]);
}

/** 시작부터 지금까지 걸린 시간(초) */
export function elapsedSec(startedAt: number): number {
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}
