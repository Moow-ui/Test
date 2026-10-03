import { INDEXNOW_ENDPOINTS, INDEXNOW_KEY, INDEXNOW_MAX_ATTEMPTS, INDEXNOW_MAX_URLS } from "../../config/indexnow";
import type { D1Like } from "./db";

/**
 * IndexNow 자동 제출 (서버 전용). 1시간마다 정기 작업(custom-worker.ts)이 runIndexNow 를 부른다.
 *
 *   1. 사이트의 sitemap(/sitemap.xml → 언어별 sitemap)을 읽어 "주소 → lastmod" 목록을 만든다.
 *   2. D1 에 저장해 둔 직전 목록과 비교해 새로 생긴 주소, lastmod 가 바뀐 주소만 고른다.
 *      저장된 목록이 없으면(첫 실행) 전체를 고른다. 고른 게 없으면 아무것도 제출하지 않는다.
 *   3. config/indexnow.ts 의 주소들로 한 번에(최대 10,000개씩) 제출하고, 결과를 indexnow_log 에 남긴다.
 *
 * 배포와 따로 돌기 때문에 여기서 무엇이 실패해도 배포·루틴은 실패하지 않는다.
 * 제출이 실패하면 직전 목록을 그대로 두어 다음 회차에 다시 내고, 같은 변경분이 3번 실패하면 포기하고 기록만 남긴다.
 */

export type SitemapSnapshot = Record<string, string>;

export interface EndpointResult {
  name: string;
  /** HTTP 응답 코드. 연결 자체가 안 됐으면 0 */
  status: number;
}

export interface IndexNowDeps {
  db: D1Like;
  /** 사이트 안의 주소(절대 주소)를 읽어 본문을 돌려준다 */
  loadText: (url: string) => Promise<string>;
  /** 사이트 주소 (sitemap 목록 /sitemap.xml 을 찾는 기준) */
  siteUrl: string;
  fetch?: typeof fetch;
  now?: () => number;
}

export type RunOutcome =
  | { kind: "unchanged" }
  | { kind: "submitted"; count: number; first: boolean }
  | { kind: "retry"; count: number; attempts: number }
  | { kind: "gave_up"; count: number };

const STATE_SNAPSHOT = "sitemap";
const STATE_FAIL = "fail";

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** sitemap 한 개 → { 주소: lastmod } (lastmod 가 없으면 "") */
export function parseUrlset(xml: string): SitemapSnapshot {
  const out: SitemapSnapshot = {};
  for (const [, body] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = body.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim();
    if (!loc) continue;
    out[decodeXml(loc)] = body.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]?.trim() ?? "";
  }
  return out;
}

/** sitemap 목록(/sitemap.xml) → 언어별 sitemap 주소들 */
export function parseSitemapIndex(xml: string): string[] {
  return [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([\s\S]*?)<\/loc>[\s\S]*?<\/sitemap>/g)].map((m) =>
    decodeXml(m[1].trim()),
  );
}

/** 직전 목록 대비 새로 생기거나 lastmod 가 바뀐 주소. 직전 목록이 없으면 전부 */
export function changedUrls(previous: SitemapSnapshot | null, current: SitemapSnapshot): string[] {
  return Object.keys(current)
    .filter((url) => !previous || !(url in previous) || previous[url] !== current[url])
    .sort();
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function isAccepted(status: number): boolean {
  return status === 200 || status === 202;
}

/** 변경분을 구별하는 짧은 값 (같은 변경분의 재시도 횟수를 세는 데 쓴다) */
function signature(urls: string[]): string {
  let hash = 5381;
  for (const ch of urls.join("\n")) hash = ((hash * 33) ^ ch.charCodeAt(0)) >>> 0;
  return `${urls.length}:${hash.toString(16)}`;
}

/** 사이트의 sitemap 전체를 읽는다 */
export async function loadSnapshot(deps: Pick<IndexNowDeps, "loadText" | "siteUrl">): Promise<SitemapSnapshot> {
  const index = await deps.loadText(`${deps.siteUrl.replace(/\/+$/, "")}/sitemap.xml`);
  const files = parseSitemapIndex(index);
  if (files.length === 0) throw new Error("sitemap 목록이 비어 있음");
  const snapshot: SitemapSnapshot = {};
  for (const file of files) Object.assign(snapshot, parseUrlset(await deps.loadText(file)));
  if (Object.keys(snapshot).length === 0) throw new Error("sitemap 에 주소가 없음");
  return snapshot;
}

async function readState<T>(db: D1Like, key: string): Promise<T | null> {
  const row = await db.prepare("SELECT value FROM indexnow_state WHERE key = ?").bind(key).first<{ value: string }>();
  return row ? (JSON.parse(row.value) as T) : null;
}

function writeState(db: D1Like, key: string, value: unknown) {
  return db
    .prepare("INSERT INTO indexnow_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, JSON.stringify(value));
}

function deleteState(db: D1Like, key: string) {
  return db.prepare("DELETE FROM indexnow_state WHERE key = ?").bind(key);
}

function logRow(db: D1Like, at: number, count: number, results: EndpointResult[], note: string) {
  return db
    .prepare("INSERT INTO indexnow_log (created_at, url_count, results, note) VALUES (?, ?, ?, ?)")
    .bind(at, count, JSON.stringify(results), note);
}

/** 주소들을 IndexNow 로 제출한다 (주소의 host 별로, 10,000개씩, 등록된 주소마다) */
export async function submitUrls(urls: string[], fetchImpl: typeof fetch): Promise<{ ok: boolean; results: EndpointResult[] }> {
  const byHost = new Map<string, string[]>();
  for (const url of urls) {
    const host = new URL(url).host;
    byHost.set(host, [...(byHost.get(host) ?? []), url]);
  }

  const results: EndpointResult[] = [];
  let ok = true;
  for (const [host, hostUrls] of byHost) {
    const protocol = new URL(hostUrls[0]).protocol;
    for (const urlList of chunk(hostUrls, INDEXNOW_MAX_URLS)) {
      const body = JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${protocol}//${host}/${INDEXNOW_KEY}.txt`,
        urlList,
      });
      let anyAccepted = false;
      for (const endpoint of INDEXNOW_ENDPOINTS) {
        let status = 0;
        try {
          const response = await fetchImpl(endpoint.url, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body,
            signal: AbortSignal.timeout(20_000),
          });
          status = response.status;
        } catch (error) {
          console.error(`[indexnow] ${endpoint.name} 연결 실패`, error);
        }
        results.push({ name: endpoint.name, status });
        if (isAccepted(status)) anyAccepted = true;
      }
      // 규격상 한 곳만 받아도 참여 검색엔진 전체에 공유되므로, 묶음마다 한 곳 이상 받으면 성공으로 본다
      if (!anyAccepted) ok = false;
    }
  }
  return { ok, results };
}

/** 정기 작업 1회 */
export async function runIndexNow(deps: IndexNowDeps): Promise<RunOutcome> {
  const { db } = deps;
  const now = deps.now ?? Date.now;
  const current = await loadSnapshot(deps);
  const previous = await readState<SitemapSnapshot>(db, STATE_SNAPSHOT);
  const urls = changedUrls(previous, current);

  if (urls.length === 0) {
    // 주소가 빠지기만 한 경우에도 목록은 지금 것으로 맞춰 둔다 (제출은 하지 않는다)
    if (previous && Object.keys(previous).length !== Object.keys(current).length) {
      await writeState(db, STATE_SNAPSHOT, current).run();
    }
    return { kind: "unchanged" };
  }

  const first = previous === null;
  const { ok, results } = await submitUrls(urls, deps.fetch ?? fetch);
  const at = now();

  if (ok) {
    await db.batch([
      writeState(db, STATE_SNAPSHOT, current),
      deleteState(db, STATE_FAIL),
      logRow(db, at, urls.length, results, first ? "first" : "ok"),
    ]);
    return { kind: "submitted", count: urls.length, first };
  }

  const sig = signature(urls);
  const fail = await readState<{ sig: string; attempts: number }>(db, STATE_FAIL);
  const attempts = (fail?.sig === sig ? fail.attempts : 0) + 1;
  if (attempts >= INDEXNOW_MAX_ATTEMPTS) {
    await db.batch([
      writeState(db, STATE_SNAPSHOT, current),
      deleteState(db, STATE_FAIL),
      logRow(db, at, urls.length, results, "gave_up"),
    ]);
    console.error(`[indexnow] ${attempts}번 실패해 이번 변경분(${urls.length}개)은 포기`);
    return { kind: "gave_up", count: urls.length };
  }
  await db.batch([writeState(db, STATE_FAIL, { sig, attempts }), logRow(db, at, urls.length, results, "retry")]);
  console.error(`[indexnow] 제출 실패 (${attempts}/${INDEXNOW_MAX_ATTEMPTS}), 다음 회차에 다시 낸다`);
  return { kind: "retry", count: urls.length, attempts };
}

export interface LogEntry {
  createdAt: number;
  urlCount: number;
  results: EndpointResult[];
}

/** 최근 제출 기록 (날짜·주소 수·응답 코드만) */
export async function recentLogs(db: D1Like, limit = 20): Promise<LogEntry[]> {
  const { results } = await db
    .prepare("SELECT created_at, url_count, results FROM indexnow_log ORDER BY id DESC LIMIT ?")
    .bind(limit)
    .all<{ created_at: number; url_count: number; results: string }>();
  return results.map((row) => ({
    createdAt: row.created_at,
    urlCount: row.url_count,
    results: JSON.parse(row.results) as EndpointResult[],
  }));
}

/** 확인 주소(/api/indexnow)에 보여 줄 글 */
export function formatLogs(entries: LogEntry[]): string {
  const kst = (ms: number) => new Date(ms + 9 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
  const lines = entries.map(
    (e) =>
      `${kst(e.createdAt)} KST | URL ${e.urlCount}개 | ` +
      e.results.map((r) => `${r.name} ${r.status === 0 ? "연결 실패" : r.status}`).join(" · "),
  );
  return [
    "IndexNow 제출 기록 (최근 20건, 5분마다 갱신, 200·202 = 성공)",
    "",
    ...(lines.length > 0 ? lines : ["아직 제출 기록이 없습니다. 정기 작업은 1시간마다 돕니다."]),
    "",
  ].join("\n");
}
