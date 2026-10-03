import { describe, expect, it } from "vitest";
import { INDEXNOW_ENDPOINTS, INDEXNOW_KEY, INDEXNOW_MAX_ATTEMPTS, INDEXNOW_MAX_URLS } from "@/config/indexnow";
import type { D1Like, D1Statement } from "@/lib/server/db";
import {
  changedUrls,
  chunk,
  formatLogs,
  parseSitemapIndex,
  parseUrlset,
  recentLogs,
  runIndexNow,
  submitUrls,
} from "@/lib/server/indexnow";

const SITE = "https://exampasso.com";

function urlset(entries: Record<string, string>): string {
  const urls = Object.entries(entries).map(
    ([path, lastmod]) => `<url>\n<loc>${SITE}${path}</loc>\n<lastmod>${lastmod}</lastmod>\n</url>`,
  );
  return `<?xml version="1.0"?>\n<urlset>\n${urls.join("\n")}\n</urlset>`;
}

const INDEX = `<sitemapindex>
<sitemap>\n<loc>${SITE}/sitemaps/ko.xml</loc>\n</sitemap>
<sitemap>\n<loc>${SITE}/sitemaps/en.xml</loc>\n</sitemap>
</sitemapindex>`;

describe("IndexNow 설정", () => {
  it("키는 규격(8~128자, 영문·숫자·-)에 맞고, 공용 주소와 네이버 주소에 낸다", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
    expect(INDEXNOW_ENDPOINTS.map((e) => e.url)).toEqual([
      "https://api.indexnow.org/indexnow",
      "https://searchadvisor.naver.com/indexnow",
    ]);
    expect(INDEXNOW_MAX_URLS).toBe(10_000);
  });
});

describe("sitemap 비교", () => {
  it("sitemap 목록과 언어별 sitemap 을 읽는다", () => {
    expect(parseSitemapIndex(INDEX)).toEqual([`${SITE}/sitemaps/ko.xml`, `${SITE}/sitemaps/en.xml`]);
    expect(parseUrlset(urlset({ "/ko": "2026-10-01", "/ko/about?a=1&amp;b=2": "2026-09-01" }))).toEqual({
      [`${SITE}/ko`]: "2026-10-01",
      [`${SITE}/ko/about?a=1&b=2`]: "2026-09-01",
    });
  });

  it("첫 실행(직전 목록 없음)이면 전부, 그다음부터는 새 주소와 lastmod 가 바뀐 주소만 고른다", () => {
    const current = { a: "2026-10-03", b: "2026-10-01", c: "2026-10-01" };
    expect(changedUrls(null, current)).toEqual(["a", "b", "c"]);
    expect(changedUrls({ a: "2026-10-01", b: "2026-10-01", gone: "2026-01-01" }, current)).toEqual(["a", "c"]);
    expect(changedUrls(current, current)).toEqual([]);
  });

  it("10,000개씩 나눈다", () => {
    const sizes = chunk(Array.from({ length: 20_001 }, (_, i) => i), INDEXNOW_MAX_URLS).map((c) => c.length);
    expect(sizes).toEqual([10_000, 10_000, 1]);
  });
});

/** 제출 요청을 기록하고 정해진 응답 코드를 돌려주는 가짜 fetch */
function fakeFetch(statusFor: (endpoint: string) => number | "throw") {
  const calls: { endpoint: string; body: { host: string; key: string; keyLocation: string; urlList: string[] } }[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const endpoint = String(input);
    calls.push({ endpoint, body: JSON.parse(String(init?.body)) });
    const status = statusFor(endpoint);
    if (status === "throw") throw new Error("network down");
    return new Response(null, { status });
  }) as typeof fetch;
  return { impl, calls };
}

describe("제출", () => {
  it("host·key·keyLocation·urlList 를 담아 등록된 주소마다 한 번에 낸다", async () => {
    const { impl, calls } = fakeFetch(() => 202);
    const urls = [`${SITE}/ko`, `${SITE}/en`];
    const { ok, results } = await submitUrls(urls, impl);
    expect(ok).toBe(true);
    expect(results).toEqual([
      { name: "indexnow", status: 202 },
      { name: "naver", status: 202 },
    ]);
    expect(calls).toHaveLength(2);
    expect(calls[0].body).toEqual({
      host: "exampasso.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    });
  });

  it("한 곳이라도 받으면 성공, 모두 실패하거나 연결이 안 되면 실패", async () => {
    const naverDown = fakeFetch((e) => (e.includes("naver") ? "throw" : 200));
    expect((await submitUrls([`${SITE}/ko`], naverDown.impl)).ok).toBe(true);
    const allDown = fakeFetch(() => 500);
    expect((await submitUrls([`${SITE}/ko`], allDown.impl)).ok).toBe(false);
  });
});

/** node:sqlite 로 D1 을 흉내 낸다 (없는 Node 에서는 이 묶음을 건너뛴다) */
async function memoryDb(): Promise<D1Like | null> {
  let sqlite: typeof import("node:sqlite");
  try {
    sqlite = await import("node:sqlite");
  } catch {
    return null;
  }
  const raw = new sqlite.DatabaseSync(":memory:");
  raw.exec(`
    CREATE TABLE indexnow_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE indexnow_log (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL,
      url_count INTEGER NOT NULL, results TEXT NOT NULL, note TEXT NOT NULL);
  `);
  const statement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...next) => statement(query, next),
    first: async <T>() => (raw.prepare(query).get(...(values as never[])) as T | undefined) ?? null,
    run: async () => raw.prepare(query).run(...(values as never[])),
    all: async <T>() => ({ results: raw.prepare(query).all(...(values as never[])) as T[] }),
  });
  return { prepare: (query) => statement(query), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

describe("정기 작업 (DB)", async () => {
  const available = (await memoryDb()) !== null;

  function site(ko: Record<string, string>, en: Record<string, string>) {
    const files: Record<string, string> = {
      [`${SITE}/sitemap.xml`]: INDEX,
      [`${SITE}/sitemaps/ko.xml`]: urlset(ko),
      [`${SITE}/sitemaps/en.xml`]: urlset(en),
    };
    return async (url: string) => {
      if (!(url in files)) throw new Error(`없는 주소 ${url}`);
      return files[url];
    };
  }

  it.skipIf(!available)("첫 실행은 전체, 다음은 바뀐 것만, 바뀐 게 없으면 제출하지 않는다", async () => {
    const db = (await memoryDb())!;
    const ok = fakeFetch(() => 200);
    const base = { db, siteUrl: SITE, fetch: ok.impl, now: () => Date.UTC(2026, 9, 3, 0, 0) };

    const v1 = site({ "/ko": "2026-10-01", "/ko/cert/a": "2026-10-01" }, { "/en": "2026-10-01" });
    expect(await runIndexNow({ ...base, loadText: v1 })).toEqual({ kind: "submitted", count: 3, first: true });

    expect(await runIndexNow({ ...base, loadText: v1 })).toEqual({ kind: "unchanged" });

    // 루틴이 자격증을 하나 추가: 새 자격증 주소 + lastmod 가 바뀐 홈
    const v2 = site(
      { "/ko": "2026-10-04", "/ko/cert/a": "2026-10-01", "/ko/cert/b": "2026-10-04" },
      { "/en": "2026-10-01" },
    );
    ok.calls.length = 0;
    expect(await runIndexNow({ ...base, loadText: v2 })).toEqual({ kind: "submitted", count: 2, first: false });
    expect(ok.calls[0].body.urlList).toEqual([`${SITE}/ko`, `${SITE}/ko/cert/b`]);

    const logs = await recentLogs(db);
    expect(logs.map((l) => l.urlCount)).toEqual([2, 3]);
    const text = formatLogs(logs);
    expect(text).toContain("2026-10-03 09:00 KST | URL 2개 | indexnow 200 · naver 200");
    expect(text).not.toContain("/ko/cert/b"); // 주소 목록은 보여 주지 않는다
  });

  it.skipIf(!available)("실패하면 목록을 그대로 두고 다시 내며, 3번 실패하면 포기한다", async () => {
    const db = (await memoryDb())!;
    const down = fakeFetch(() => 503);
    const loadText = site({ "/ko": "2026-10-01" }, { "/en": "2026-10-01" });
    const run = () => runIndexNow({ db, siteUrl: SITE, loadText, fetch: down.impl });

    for (let attempt = 1; attempt < INDEXNOW_MAX_ATTEMPTS; attempt++) {
      expect(await run()).toEqual({ kind: "retry", count: 2, attempts: attempt });
    }
    expect(await run()).toEqual({ kind: "gave_up", count: 2 });
    expect(await run()).toEqual({ kind: "unchanged" });
    expect((await recentLogs(db)).length).toBe(INDEXNOW_MAX_ATTEMPTS);
  });

  it.skipIf(!available)("sitemap 을 읽지 못하면 아무것도 바꾸지 않고 오류를 낸다 (정기 작업이 로그로만 남긴다)", async () => {
    const db = (await memoryDb())!;
    const broken = async () => {
      throw new Error("500");
    };
    await expect(runIndexNow({ db, siteUrl: SITE, loadText: broken, fetch: fakeFetch(() => 200).impl })).rejects.toThrow();
    expect(await recentLogs(db)).toEqual([]);
  });
});
