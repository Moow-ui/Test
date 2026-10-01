"use client";

import { useEffect } from "react";
import { pullSync, pushSync, refreshAuth, useAuth } from "@/lib/auth-client";
import { subscribe } from "@/lib/storage";

/** 기록이 바뀐 뒤 이만큼 기다렸다가 한 번에 저장한다 */
const PUSH_DELAY_MS = 800;

/**
 * 로그인 상태 확인 + 계정 기록 자동 저장 (화면에는 아무것도 그리지 않는다).
 * 로그인한 동안에는 풀이 기록·점수 기록·오답노트·보유 자격증이 바뀔 때마다 계정에 저장한다.
 */
export function SyncManager() {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;

  useEffect(() => {
    void refreshAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let ready = false;
    let timer: number | undefined;

    void pullSync().then((ok) => {
      ready = ok;
    });

    const unsubscribe = subscribe(() => {
      if (!ready) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void pushSync(), PUSH_DELAY_MS);
    });

    // 창을 닫거나 다른 곳으로 갈 때 아직 저장하지 못한 기록을 마저 보낸다
    const flush = () => {
      if (ready) void pushSync(false, true);
    };
    window.addEventListener("pagehide", flush);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
      window.removeEventListener("pagehide", flush);
    };
  }, [userId]);

  return null;
}
