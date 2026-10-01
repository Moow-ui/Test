"use client";

import { useSyncExternalStore } from "react";
import type { AuthUser } from "./auth-rules";
import { clearSyncData, readSyncData, writeSyncData } from "./storage";
import { mergeSyncData, normalizeSyncData, type SyncData } from "./sync-merge";

/**
 * 로그인 상태와 계정 기록 동기화 (클라이언트 전용).
 *
 * 로그인은 선택 사항이다. 로그인하지 않아도 모든 기능을 쓸 수 있고(기록은 이 기기에만 저장),
 * 로그인하면 풀이 기록·점수 기록·오답노트·보유 자격증이 계정에 저장되어 다른 기기에서도 이어진다.
 * 화면은 여전히 lib/storage.ts 의 값만 읽고, 이 파일이 그 값을 서버와 맞춘다.
 */

export interface AuthState {
  /** loading: 확인 중, guest: 로그인 안 함, user: 로그인함 */
  status: "loading" | "guest" | "user";
  user: AuthUser | null;
  /** 로그인 서버(DB)에 연결되어 있는가 */
  available: boolean;
}

const LOADING: AuthState = { status: "loading", user: null, available: true };

let state: AuthState = LOADING;
const listeners = new Set<() => void>();

function setState(next: AuthState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribeAuth,
    () => state,
    () => LOADING,
  );
}

async function request(url: string, init?: RequestInit): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: response.ok, body };
  } catch {
    return { ok: false, body: { error: "network" } };
  }
}

/** 로그인 직후에는 이 기기의 기록을 계정 기록과 합친다 (그 외에는 계정 기록으로 바꾼다) */
let mergeOnNextPull = false;

/** 지금 로그인되어 있는지 서버에 물어본다 (화면이 열릴 때 한 번) */
export async function refreshAuth(): Promise<void> {
  const { ok, body } = await request("/api/auth/me");
  if (!ok) return setState({ status: "guest", user: null, available: false });
  const user = (body.user as AuthUser | null) ?? null;
  setState({ status: user ? "user" : "guest", user, available: body.available !== false });
}

/** 성공하면 null, 실패하면 오류 코드 (화면 문구는 messages 의 "errors") */
export async function login(username: string, password: string): Promise<string | null> {
  const { ok, body } = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  if (!ok) return String(body.error ?? "unknown");
  mergeOnNextPull = true;
  setState({ status: "user", user: body.user as AuthUser, available: true });
  return null;
}

export async function signup(username: string, password: string, nickname: string): Promise<string | null> {
  const { ok, body } = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, password, nickname }),
  });
  if (!ok) return String(body.error ?? "unknown");
  mergeOnNextPull = true;
  setState({ status: "user", user: body.user as AuthUser, available: true });
  return null;
}

export async function logout(): Promise<void> {
  await pushSync();
  await request("/api/auth/logout", { method: "POST" });
  clearSyncData();
  lastSynced = "";
  setState({ status: "guest", user: null, available: true });
}

/** 회원 탈퇴. 성공하면 null, 실패하면 오류 코드 */
export async function deleteAccount(): Promise<string | null> {
  const { ok, body } = await request("/api/auth/me", { method: "DELETE" });
  if (!ok) return String(body.error ?? "unknown");
  clearSyncData();
  lastSynced = "";
  setState({ status: "guest", user: null, available: true });
  return null;
}

// ───────────────────────── 기록 동기화 ─────────────────────────

/** 마지막으로 서버와 맞춘 내용. 이 값과 달라졌을 때만 서버에 보낸다 */
let lastSynced = "";

function snapshot(): string {
  return JSON.stringify(readSyncData());
}

/** 서버의 내 기록을 가져와 이 기기에 반영한다. 성공하면 true */
export async function pullSync(): Promise<boolean> {
  const { ok, body } = await request("/api/sync");
  if (!ok) return false;
  const remote = normalizeSyncData(body.data as Partial<Record<keyof SyncData, unknown>> | undefined);
  const merge = mergeOnNextPull;
  mergeOnNextPull = false;

  if (merge) {
    writeSyncData(mergeSyncData(readSyncData(), remote));
    // 합친 결과가 계정 기록과 다를 수 있으므로 바로 올린다
    await pushSync(true);
  } else {
    writeSyncData(remote);
    lastSynced = snapshot();
  }
  return true;
}

/** 이 기기의 기록이 바뀌었으면 서버에 저장한다 */
export async function pushSync(force = false, keepalive = false): Promise<void> {
  if (state.status !== "user") return;
  const current = snapshot();
  if (!force && current === lastSynced) return;
  const { ok } = await request("/api/sync", {
    method: "PUT",
    body: JSON.stringify({ data: JSON.parse(current) }),
    keepalive,
  });
  if (ok) lastSynced = current;
}
