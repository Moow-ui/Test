import type { QuizLevel } from "./types";

/**
 * 브라우저 저장소(localStorage) 접근 계층 (클라이언트 전용).
 *
 * 풀이 기록·진행 중인 풀이·오답노트·화면 설정을 모두 여기서만 읽고 쓴다.
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
  results: "qpass:results",
  ownedCerts: "qpass:ownedCerts",
  lastLevel: "qpass:lastLevel",
  instantCheck: "qpass:instantCheck",
  examZoom: "qpass:examZoom",
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

/** 이름(보통·크게·아주 크게)은 messages 의 "display.sizes" 에 있다 */
export const FONT_SCALES: FontScale[] = ["md", "lg", "xl"];

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
  /** 가장 최근에 풀었을 때 맞혔는가 */
  lastCorrect?: boolean;
  /** 어느 자격증의 문제인가 (프로필에서 문제 내용을 불러올 때 쓴다) */
  certId?: string;
}

export type SolveHistoryStore = Record<string, HistoryEntry>;
export const EMPTY_HISTORY: SolveHistoryStore = {};

export function getHistory(): SolveHistoryStore {
  return readJson<SolveHistoryStore>(STORAGE_KEYS.history, EMPTY_HISTORY);
}

export function recordAnswer(
  questionId: string,
  correct: boolean,
  certId?: string,
  now = Date.now(),
): void {
  const history = getHistory();
  const prev = history[questionId] ?? { lastSolvedAt: 0, correct: 0, wrong: 0 };
  writeJson(STORAGE_KEYS.history, {
    ...history,
    [questionId]: {
      lastSolvedAt: now,
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
      lastCorrect: correct,
      certId: certId ?? prev.certId,
    },
  });
}

// ───────────────────────── 점수 기록 ─────────────────────────

/** 끝까지 푼 시험 한 번의 기록 */
export interface ResultRecord {
  id: string;
  certId: string;
  /** "초급 · 전체 과목", "실전 CBT 체험" 등 */
  label: string;
  kind: "quiz" | "cbt";
  total: number;
  correct: number;
  /** 0~100 */
  score: number;
  at: number;
  /** 틀리거나 안 푼 문제 id */
  wrongIds: string[];
}

export const EMPTY_RESULTS: ResultRecord[] = [];
const RESULT_LIMIT = 200;

export function getResults(): ResultRecord[] {
  return readJson<ResultRecord[]>(STORAGE_KEYS.results, EMPTY_RESULTS);
}

export function addResult(record: Omit<ResultRecord, "id" | "at">): void {
  const now = Date.now();
  writeJson(
    STORAGE_KEYS.results,
    [{ ...record, id: newSessionId(now), at: now }, ...getResults()].slice(0, RESULT_LIMIT),
  );
}

// ───────────────────────── 보유 자격증 (프로필의 칭호) ─────────────────────────

export interface OwnedCert {
  /** 목록에 있는 자격증이면 그 id, 직접 적은 자격증이면 "custom:이름" */
  key: string;
  name: string;
  /** 기능사·산업기사·기사 등. 직접 적은 자격증은 null */
  grade: string | null;
  /** 취득 연도 (모르면 null) */
  year: number | null;
  addedAt: number;
}

export const EMPTY_OWNED: OwnedCert[] = [];

export function getOwnedCerts(): OwnedCert[] {
  return readJson<OwnedCert[]>(STORAGE_KEYS.ownedCerts, EMPTY_OWNED);
}

export function addOwnedCert(cert: Omit<OwnedCert, "addedAt">): void {
  const current = getOwnedCerts().filter((c) => c.key !== cert.key);
  writeJson(STORAGE_KEYS.ownedCerts, [...current, { ...cert, addedAt: Date.now() }]);
}

export function removeOwnedCert(key: string): void {
  writeJson(
    STORAGE_KEYS.ownedCerts,
    getOwnedCerts().filter((c) => c.key !== key),
  );
}

// ───────────────────────── 계정 동기화 대상 ─────────────────────────

/** 로그인하면 계정에 함께 저장되는 항목 (lib/sync-merge.ts 의 SyncData 와 짝) */
export function readSyncData() {
  return {
    history: getHistory(),
    notes: getNotes(),
    results: getResults(),
    ownedCerts: getOwnedCerts(),
  };
}

export function writeSyncData(data: {
  history: SolveHistoryStore;
  notes: NoteEntry[];
  results: ResultRecord[];
  ownedCerts: OwnedCert[];
}): void {
  writeJson(STORAGE_KEYS.history, data.history);
  writeJson(STORAGE_KEYS.notes, data.notes);
  writeJson(STORAGE_KEYS.results, data.results);
  writeJson(STORAGE_KEYS.ownedCerts, data.ownedCerts);
}

/** 로그아웃할 때: 다음 사람이 이 기기에서 내 기록을 보지 못하게 지운다 */
export function clearSyncData(): void {
  for (const key of [STORAGE_KEYS.history, STORAGE_KEYS.notes, STORAGE_KEYS.results, STORAGE_KEYS.ownedCerts]) {
    removeKey(key);
  }
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
  /** "바로 답 확인하기"로 이미 채점해 보여 준 문제 (답을 더 바꿀 수 없다) */
  revealed?: Record<string, boolean>;
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

// ───────────────────────── 시험 화면 설정 ─────────────────────────

/** "바로 답 확인하기" 체크 여부 (기본: 켜짐) */
export function setInstantCheck(value: boolean): void {
  writeJson(STORAGE_KEYS.instantCheck, value);
}

/** 시험 화면 글자 크기 (실제 CBT 처럼 100% / 150% / 200%) */
export type ExamZoom = 100 | 150 | 200;

export const EXAM_ZOOMS: Array<{ value: ExamZoom; px: number }> = [
  { value: 100, px: 17 },
  { value: 150, px: 21 },
  { value: 200, px: 25 },
];

export function setExamZoom(value: ExamZoom): void {
  writeJson(STORAGE_KEYS.examZoom, value);
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
  /** 내가 직접 적은 메모 (나만의 오답노트) */
  memo?: string;
}

export const EMPTY_NOTES: NoteEntry[] = [];

export function getNotes(): NoteEntry[] {
  return readJson<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);
}

/** 오답노트에 담는다. 이미 있는 문제는 최신 내용으로 바꾼다. 새로 담긴 개수를 돌려준다 */
export function addNotes(items: Array<Omit<NoteEntry, "addedAt" | "memo">>): number {
  const now = Date.now();
  const current = getNotes();
  // 이미 적어 둔 메모는 다시 담아도 지워지지 않게 한다
  const entries: NoteEntry[] = items.map((item) => ({
    ...item,
    addedAt: now,
    memo: current.find((c) => c.questionId === item.questionId)?.memo,
  }));
  const incoming = new Map(entries.map((e) => [e.questionId, e]));
  const added = entries.filter((e) => !current.some((c) => c.questionId === e.questionId)).length;
  const kept = current.filter((c) => !incoming.has(c.questionId));
  writeJson(STORAGE_KEYS.notes, [...entries, ...kept]);
  return added;
}

/**
 * 채점한 순간 틀린 문제를 오답노트에 담는다 (연습 풀이·실전 CBT 공용).
 * 답을 골라서 틀린 문제만 담고, 안 푼 문제는 담지 않는다. 이미 있는 문제는 겹쳐 담기지 않는다.
 */
export function addWrongNotes(
  certId: string,
  questions: Array<{ id: string; answer: number }>,
  answers: Record<string, number | undefined>,
): void {
  const wrong = questions.flatMap((q) => {
    const chosen = answers[q.id];
    return chosen !== undefined && chosen !== q.answer ? [{ questionId: q.id, certId, chosen }] : [];
  });
  if (wrong.length > 0) addNotes(wrong);
}

/** 오답노트의 문제에 내 메모를 적는다 */
export function setNoteMemo(questionId: string, memo: string): void {
  writeJson(
    STORAGE_KEYS.notes,
    getNotes().map((n) => (n.questionId === questionId ? { ...n, memo: memo.trim() || undefined } : n)),
  );
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

export function newSessionId(now = Date.now()): string {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`;
}
