"use client";

import { useSyncExternalStore } from "react";
import {
  getFontScale,
  getTheme,
  readJson,
  subscribe,
  type FontScale,
  type Theme,
} from "./storage";

/**
 * localStorage 값을 구독하는 훅.
 * 서버 렌더링·첫 hydration 때는 fallback 을, 그 뒤에는 저장된 값을 돌려준다.
 * fallback 은 매번 같은 객체여야 한다 (모듈 상수나 null 을 넘길 것).
 */
export function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => readJson(key, fallback),
    () => fallback,
  );
}

const noopSubscribe = () => () => {};

/** 브라우저에서 hydration 이 끝났는가 (localStorage 값을 믿고 그려도 되는 시점) */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useTheme(): Theme {
  return useSyncExternalStore<Theme>(subscribe, getTheme, () => "light");
}

export function useFontScale(): FontScale {
  return useSyncExternalStore<FontScale>(subscribe, getFontScale, () => "md");
}
