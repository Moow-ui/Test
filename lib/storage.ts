import type { QuizLevel } from "./types";

/**
 * 브라우저 저장소(localStorage) 접근 계층 (클라이언트 전용).
 *
 * 풀이 기록·진행 중인 풀이·오답노트·신고·화면 설정을 모두 여기서만 읽고 쓴다.
 * 나중에 로그인/Supabase 로 옮길 때 이 파일의 함수 내용만 바꾸면 된다.
 * 화면에서는 lib/use-storage.ts 의 훅으로 값을 구독한다.
 */

export const STORAGE_KEYS = {
  theme: "qpass:theme",
  font: "qpass:font",
  fontsReady: "qpass:fontsReady",
  recent: "qpass:recent",
  history: "qpass:history",
  notes: "qpass:notes",
  reports: "qpass:reports",
  lastLevel: "qpass:lastLevel",
  session: (certId: string) => `qpass:session:${certId}`,
  cbt: (certId: string) => `qpass:cbt:${certId}`,
} as const;

// ───────────────────────── 공통 읽기/쓰기 ─────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

function getRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // 사생활 보호 모드 등으로 저장소를 못 쓰는 경우
  }
}

/**
 * JSON 값을 읽는다. 저장된 문자열이 바뀌지 않았으면 같은 객체를 돌려주므로
 * useSyncExternalStore 의 getSnapshot 으로 그대로 쓸 수 있다.
 */
export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = getRaw(key);
  const hit = snapshots.get(key);
  if (hit && hit.raw === raw) return hit.value as T;

  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

export function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간이 없거나 저장소를 못 쓰는 경우: 화면은 계속 동작하게 둔다
  }
  notify();
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 무시
  }
  notify();
}

// ───────────────────────── 화면 설정 ─────────────────────────

export type Theme = "light" | "dark";
export type FontScale = "md" | "lg" | "xl";

export const FONT_SCALES: Array<{ value: FontScale; label: string }> = [
  { value: "md", label: "보통" },
  { value: "lg", label: "크게" },
  { value: "xl", label: "아주 크게" },
];

export function getTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  writeJson(STORAGE_KEYS.theme, theme);
}

export function getFontScale(): FontScale {
  if (typeof document === "undefined") return "md";
  const value = document.documentElement.dataset.font;
  return value === "lg" || value === "xl" ? value : "md";
}

export function setFontScale(scale: FontScale): void {
  document.documentElement.dataset.font = scale;
  writeJson(STORAGE_KEYS.font, scale);
}

/**
 * 첫 화면이 그려지기 전에 저장된 테마·글씨 크기를 적용하는 인라인 스크립트.
 * (app/layout.tsx 에서 사용. 깜빡임 방지)
 */
export const DISPLAY_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var t=JSON.parse(localStorage.getItem("${STORAGE_KEYS.theme}"));if(t==="dark"||(t==null&&window.matchMedia("(prefers-color-scheme: dark)").matches)){d.classList.add("dark")}var f=JSON.parse(localStorage.getItem("${STORAGE_KEYS.font}"));if(f==="lg"||f==="xl"){d.dataset.font=f}if(localStorage.getItem("${STORAGE_KEYS.fontsReady}")==="1"){d.classList.add("fonts-ready")}}catch(e){}})();`;

/** 웹폰트(Pretendard)를 한 번 받은 적이 있다고 기록한다. 다음 방문부터는 처음부터 웹폰트로 그린다 */
export function markFontsReady(): void {
  try {
    window.localStorage.setItem(STORAGE_KEYS.fontsReady, "1");
  } catch {
    // 무시
  }
}

// ───────────────────────── 최근 공부한 자격증 ─────────────────────────

export interface RecentCert {
  certId: string;
  at: number;
}

export const EMPTY_RECENT: RecentCert[] = [];
const RECENT_LIMIT = 5;

export function touchRecentCert(certId: string, now = Date.now()): void {
  const current = readJson<RecentCert[]>(STORAGE_KEYS.recent, EMPTY_RECENT);
  if (current[0]?.certId === certId && now - current[0].at < 60_000) return;
  const next = [{ certId, at: now }, ...current.filter((r) => r.certId !== certId)].slice(
    0,
    RECENT_LIMIT,
  );
  writeJson(STORAGE_KEYS.recent, next);
}

export function getLastLevel(): QuizLevel {
  const value = readJson<string | null>(STORAGE_KEYS.lastLevel, null);
  return value === "intermediate" || value === "advanced" ? value : "basic";
}

export function setLastLevel(level: QuizLevel): void {
  writeJson(STORAGE_KEYS.lastLevel, level);
}

// ───────────────────────── 풀이 기록 ─────────────────────────

export interface HistoryEntry {
  lastSolvedAt: number;
  correct: number;
  wrong: number;
}

export type SolveHistoryStore = Record<string, HistoryEntry>;
export const EMPTY_HISTORY: SolveHistoryStore = {};

export function getHistory(): SolveHistoryStore {
  return readJson<SolveHistoryStore>(STORAGE_KEYS.history, EMPTY_HISTORY);
}

export function recordAnswer(questionId: string, correct: boolean, now = Date.now()): void {
  const history = getHistory();
  const prev = history[questionId] ?? { lastSolvedAt: 0, correct: 0, wrong: 0 };
  writeJson(STORAGE_KEYS.history, {
    ...history,
    [questionId]: {
      lastSolvedAt: now,
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    },
  });
}

// ───────────────────────── 진행 중인 풀이 (이어서 풀기) ─────────────────────────

export type SessionMode = "level" | "retry" | "notes" | "chapter";

export interface QuizSession {
  id: string;
  certId: string;
  mode: SessionMode;
  /** 화면에 보여 줄 풀이 이름 (예: "초급 · 전체 범위") */
  label: string;
  level: QuizLevel | null;
  subjectId: string | null;
  questionIds: string[];
  /** 문제 id → 고른 답(1~4) */
  answers: Record<string, number>;
  currentIndex: number;
  startedAt: number;
  finishedAt: number | null;
}

export function loadSession(certId: string): QuizSession | null {
  return readJson<QuizSession | null>(STORAGE_KEYS.session(certId), null);
}

export function saveSession(session: QuizSession): void {
  writeJson(STORAGE_KEYS.session(session.certId), session);
}

/** 새 풀이를 만들어 저장한다 (id·시작 시각은 여기서 붙인다) */
export function startSession(
  input: Pick<QuizSession, "certId" | "mode" | "label" | "level" | "subjectId" | "questionIds">,
): QuizSession {
  const now = Date.now();
  const session: QuizSession = {
    ...input,
    id: newSessionId(now),
    answers: {},
    currentIndex: 0,
    startedAt: now,
    finishedAt: null,
  };
  saveSession(session);
  return session;
}

/** 풀이를 끝낸 것으로 표시한다 (결과 화면으로 넘어감) */
export function finishSession(session: QuizSession): void {
  saveSession({ ...session, finishedAt: Date.now() });
}

export function clearSession(certId: string): void {
  removeKey(STORAGE_KEYS.session(certId));
}

/** 아직 끝내지 않은 풀이인가 (이어서 풀기 대상) */
export function isInProgress(session: QuizSession | null): session is QuizSession {
  return !!session && session.finishedAt === null && session.questionIds.length > 0;
}

// ───────────────────────── 실전 CBT 체험 ─────────────────────────

export interface CbtSession {
  id: string;
  certId: string;
  questionIds: string[];
  answers: Record<string, number>;
  currentIndex: number;
  totalSec: number;
  /** 남은 시간(초). 창을 닫으면 시간이 멈추고, 다시 열면 이어진다 */
  remainingSec: number;
  startedAt: number;
  finishedAt: number | null;
}

export function loadCbt(certId: string): CbtSession | null {
  return readJson<CbtSession | null>(STORAGE_KEYS.cbt(certId), null);
}

export function saveCbt(session: CbtSession): void {
  writeJson(STORAGE_KEYS.cbt(session.certId), session);
}

/** 새 모의고사를 만들어 저장한다 */
export function startCbt(certId: string, questionIds: string[], totalSec: number): CbtSession {
  const now = Date.now();
  const session: CbtSession = {
    id: newSessionId(now),
    certId,
    questionIds,
    answers: {},
    currentIndex: 0,
    totalSec,
    remainingSec: totalSec,
    startedAt: now,
    finishedAt: null,
  };
  saveCbt(session);
  return session;
}

/** 답안 제출 */
export function finishCbt(session: CbtSession): void {
  saveCbt({ ...session, finishedAt: Date.now() });
}

export function clearCbt(certId: string): void {
  removeKey(STORAGE_KEYS.cbt(certId));
}

// ───────────────────────── 오답노트 ─────────────────────────

export interface NoteEntry {
  questionId: string;
  certId: string;
  /** 틀렸을 때 고른 답 (안 풀었으면 null) */
  chosen: number | null;
  addedAt: number;
}

export const EMPTY_NOTES: NoteEntry[] = [];

export function getNotes(): NoteEntry[] {
  return readJson<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);
}

/** 오답노트에 담는다. 이미 있는 문제는 최신 내용으로 바꾼다. 새로 담긴 개수를 돌려준다 */
export function addNotes(items: Array<Omit<NoteEntry, "addedAt">>): number {
  const now = Date.now();
  const entries: NoteEntry[] = items.map((item) => ({ ...item, addedAt: now }));
  const current = getNotes();
  const incoming = new Map(entries.map((e) => [e.questionId, e]));
  const added = entries.filter((e) => !current.some((c) => c.questionId === e.questionId)).length;
  const kept = current.filter((c) => !incoming.has(c.questionId));
  writeJson(STORAGE_KEYS.notes, [...entries, ...kept]);
  return added;
}

export function removeNote(questionId: string): void {
  writeJson(
    STORAGE_KEYS.notes,
    getNotes().filter((n) => n.questionId !== questionId),
  );
}

export function clearNotes(certId: string): void {
  writeJson(
    STORAGE_KEYS.notes,
    getNotes().filter((n) => n.certId !== certId),
  );
}

// ───────────────────────── 문제 오류 신고 ─────────────────────────

export const REPORT_REASONS = [
  "정답이 틀린 것 같아요",
  "문제 내용이 이상해요",
  "해설이 틀렸거나 이해가 안 돼요",
  "오타가 있어요",
  "기타",
] as const;

export interface ReportEntry {
  id: string;
  certId: string;
  questionId: string;
  /** 신고 당시 문제 앞부분 (목록에서 알아보기 위한 용도) */
  stem: string;
  reason: string;
  memo: string;
  at: number;
}

export const EMPTY_REPORTS: ReportEntry[] = [];

export function getReports(): ReportEntry[] {
  return readJson<ReportEntry[]>(STORAGE_KEYS.reports, EMPTY_REPORTS);
}

export function addReport(entry: Omit<ReportEntry, "id" | "at">, now = Date.now()): void {
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  writeJson(STORAGE_KEYS.reports, [{ ...entry, id, at: now }, ...getReports()]);
}

export function removeReport(id: string): void {
  writeJson(
    STORAGE_KEYS.reports,
    getReports().filter((r) => r.id !== id),
  );
}

export function clearReports(): void {
  removeKey(STORAGE_KEYS.reports);
}

export function newSessionId(now = Date.now()): string {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`;
}
