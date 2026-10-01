import type { NoteEntry, OwnedCert, ResultRecord, SolveHistoryStore } from "./storage";

/**
 * 계정에 저장되는 기록과, 로그인할 때 이 기기의 기록을 계정 기록과 합치는 규칙.
 * 화면·저장소와 무관한 순수 함수다. (tests/sync-merge.test.ts)
 */

export const SYNC_FIELDS = ["history", "notes", "results", "ownedCerts"] as const;

export interface SyncData {
  history: SolveHistoryStore;
  notes: NoteEntry[];
  results: ResultRecord[];
  ownedCerts: OwnedCert[];
}

export const EMPTY_SYNC: SyncData = { history: {}, notes: [], results: [], ownedCerts: [] };

const RESULT_LIMIT = 200;

/** 서버에서 받은 값이 비어 있거나 모양이 다르면 빈 값으로 바꾼다 */
export function normalizeSyncData(raw: Partial<Record<keyof SyncData, unknown>> | null | undefined): SyncData {
  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  return {
    history: isObject(raw?.history) ? (raw.history as SolveHistoryStore) : {},
    notes: Array.isArray(raw?.notes) ? (raw.notes as NoteEntry[]) : [],
    results: Array.isArray(raw?.results) ? (raw.results as ResultRecord[]) : [],
    ownedCerts: Array.isArray(raw?.ownedCerts) ? (raw.ownedCerts as OwnedCert[]) : [],
  };
}

/**
 * 두 기록을 합친다 (로그인 전에 이 기기에서 푼 기록 + 계정에 있던 기록).
 *  - 풀이 기록: 문제마다 더 최근에 푼 쪽
 *  - 오답노트: 문제마다 더 최근에 담은 쪽 (메모는 있는 쪽을 살린다)
 *  - 점수 기록: 전부 모아 최신순, 최대 200개
 *  - 보유 자격증: 전부 모으되 같은 자격증은 먼저 등록한 쪽
 */
export function mergeSyncData(local: SyncData, remote: SyncData): SyncData {
  const history: SolveHistoryStore = { ...remote.history };
  for (const [id, entry] of Object.entries(local.history)) {
    const other = history[id];
    if (!other || entry.lastSolvedAt >= other.lastSolvedAt) history[id] = entry;
  }

  const notes = new Map<string, NoteEntry>();
  for (const note of [...remote.notes, ...local.notes]) {
    const other = notes.get(note.questionId);
    if (!other) notes.set(note.questionId, note);
    else {
      const newer = note.addedAt >= other.addedAt ? note : other;
      notes.set(note.questionId, { ...newer, memo: newer.memo ?? note.memo ?? other.memo });
    }
  }

  const results = new Map<string, ResultRecord>();
  for (const record of [...remote.results, ...local.results]) results.set(record.id, record);

  const owned = new Map<string, OwnedCert>();
  for (const cert of [...remote.ownedCerts, ...local.ownedCerts]) {
    const other = owned.get(cert.key);
    if (!other || cert.addedAt < other.addedAt) owned.set(cert.key, cert);
  }

  return {
    history,
    notes: [...notes.values()].sort((a, b) => b.addedAt - a.addedAt),
    results: [...results.values()].sort((a, b) => b.at - a.at).slice(0, RESULT_LIMIT),
    ownedCerts: [...owned.values()].sort((a, b) => a.addedAt - b.addedAt),
  };
}
