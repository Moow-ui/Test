"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { markFontsReady } from "@/lib/storage";

const FONT = '1em "Pretendard Variable"';

/**
 * true 로 바꾸면 처음 방문한 화면에서도 글꼴을 다 받는 즉시 Pretendard 로 바꾼다.
 * (보고 있는 화면의 글자가 한 번 바뀌고, 저사양 기기에서는 그 순간 잠깐 멈칫할 수 있다)
 */
const APPLY_ON_FIRST_VIEW = false;

/**
 * 웹폰트(Pretendard) 적용 시점을 조절한다.
 *
 * 한글 웹폰트는 글자 묶음별로 잘게 나뉜 파일(화면 하나에 15개 안팎)을 받는다.
 * 파일이 도착할 때마다 보고 있는 화면을 다시 그리면 저사양 PC·휴대폰에서 첫 화면이 버벅이고
 * 글자가 눈앞에서 바뀌어 읽기에도 불편하다. 그래서:
 *
 *  1. 처음 방문한 화면은 기기에 있는 글꼴(맑은 고딕 등)로 바로 그린다.
 *  2. 그동안 뒤에서 Pretendard 를 받아 브라우저에 저장해 둔다.
 *  3. 다음 화면으로 넘어갈 때(또는 다음 방문부터) <html class="fonts-ready"> 를 붙여 Pretendard 로 그린다.
 *
 * 글꼴 스타일은 app/globals.css 의 `html.fonts-ready body` 참고.
 */
export function FontLoader() {
  const pathname = usePathname();
  const loadedRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains("fonts-ready") || !document.fonts) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      const text = Array.from(document.querySelectorAll("header, main, footer"))
        .map((el) => el.textContent ?? "")
        .join("");
      document.fonts
        .load(FONT, text)
        .then(() => {
          if (cancelled) return;
          loadedRef.current = true;
          markFontsReady();
          if (APPLY_ON_FIRST_VIEW) root.classList.add("fonts-ready");
        })
        .catch(() => {
          // 글꼴을 못 받으면 기기 글꼴로 계속 보여 준다
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // 화면이 바뀌는 순간에 맞춰 글꼴을 바꾼다 (보고 있던 글자가 눈앞에서 바뀌지 않도록)
  useLayoutEffect(() => {
    if (loadedRef.current) document.documentElement.classList.add("fonts-ready");
  }, [pathname]);

  return null;
}
