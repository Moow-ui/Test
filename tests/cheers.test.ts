import { describe, expect, it } from "vitest";
import { CHEERS_PER_IP_PER_DAY, checkCheer } from "@/lib/cheer-rules";
import { createCheer, getAdminCheers, listPublicCheers, setCheerState } from "@/lib/server/cheers";
import type { D1Like, D1Statement } from "@/lib/server/db";

const valid = { locale: "ko", body: "  덕분에 쉬는 시간에\n잘 공부하고 있어요  ", nickname: "" };

describe("응원 입력 규칙", () => {
  it("올바른 응원은 통과하고 한 줄로 다듬는다. 닉네임은 비워도 된다", () => {
    expect(checkCheer(valid)).toEqual({ data: { locale: "ko", body: "덕분에 쉬는 시간에 잘 공부하고 있어요", nickname: "" } });
  });

  it("10~300자, 닉네임 20자, 정해진 언어만 받는다", () => {
    const check = (patch: object) => checkCheer({ ...valid, ...patch });
    expect(check({ body: "고마워요" })).toEqual({ error: "cheer_length" });
    expect(check({ body: "가".repeat(301) })).toEqual({ error: "cheer_length" });
    expect(check({ body: "가".repeat(300) })).toHaveProperty("data");
    expect(check({ nickname: "가".repeat(21) })).toEqual({ error: "cheer_nickname" });
    expect(check({ locale: "jp" })).toEqual({ error: "bad_request" });
  });

  it("링크·전화번호·금칙어는 거부한다", () => {
    expect(checkCheer({ ...valid, body: "여기 보세요 https://example.com 좋아요" })).toEqual({ error: "review_link" });
    expect(checkCheer({ ...valid, body: "연락 주세요 010-1234-5678 부탁해요" })).toEqual({ error: "review_phone" });
    expect(checkCheer({ ...valid, body: "좋은 사이트", nickname: "카지노왕" })).toEqual({ error: "cheer_length" });
    expect(checkCheer({ ...valid, nickname: "카지노왕" })).toEqual({ error: "review_banned" });
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
  raw.exec(`CREATE TABLE cheers (id TEXT PRIMARY KEY, locale TEXT NOT NULL, body TEXT NOT NULL, nickname TEXT NOT NULL,
    ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL, public INTEGER NOT NULL DEFAULT 0)`);
  const statement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...next) => statement(query, next),
    first: async <T>() => (raw.prepare(query).get(...(values as never[])) as T | undefined) ?? null,
    run: async () => raw.prepare(query).run(...(values as never[])),
    all: async <T>() => ({ results: raw.prepare(query).all(...(values as never[])) as T[] }),
  });
  return { prepare: (query) => statement(query), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const NOW = Date.UTC(2026, 10, 7, 3, 0, 0); // 2026-11-07 12:00 (한국 시간)
const DAY = 24 * 60 * 60 * 1000;
const input = { locale: "ko" as const, body: "덕분에 쉬는 시간에 잘 공부하고 있어요", nickname: "" };

describe("응원 저장·공개 (DB)", async () => {
  const available = (await memoryDb()) !== null;

  it.skipIf(!available)("같은 IP 는 하루 3개까지만 남길 수 있고, 다음 날에는 다시 남길 수 있다", async () => {
    const db = (await memoryDb())!;
    for (let i = 0; i < CHEERS_PER_IP_PER_DAY; i++) {
      expect(await createCheer(db, input, { ip: "1.1.1.1", now: NOW + i })).toEqual({ ok: true });
    }
    expect(await createCheer(db, input, { ip: "1.1.1.1", now: NOW + 10 })).toEqual({ error: "cheer_limit" });
    expect(await createCheer(db, input, { ip: "2.2.2.2", now: NOW + 11 })).toEqual({ ok: true });
    expect(await createCheer(db, input, { ip: "1.1.1.1", now: NOW + DAY })).toEqual({ ok: true });
  });

  it.skipIf(!available)("새 응원은 비공개이고, 관리자가 공개한 것만 그 언어 페이지에 보인다", async () => {
    const db = (await memoryDb())!;
    await createCheer(db, input, { ip: "1.1.1.1", now: NOW });
    await createCheer(db, { ...input, locale: "en", body: "Thanks for the free practice tests" }, { ip: "1.1.1.1", now: NOW + 1 });
    expect(await listPublicCheers(db, "ko")).toEqual([]);

    const admin = await getAdminCheers(db);
    expect(admin).toMatchObject({ total: 2, publicTotal: 0 });
    const ko = admin.cheers.find((c) => c.locale === "ko")!;

    await setCheerState(db, ko.id, "publish");
    expect((await listPublicCheers(db, "ko")).map((c) => c.body)).toEqual([input.body]);
    expect(await listPublicCheers(db, "en")).toEqual([]);

    await setCheerState(db, ko.id, "unpublish");
    expect(await listPublicCheers(db, "ko")).toEqual([]);

    await setCheerState(db, ko.id, "delete");
    expect((await getAdminCheers(db)).total).toBe(1);
  });

  it.skipIf(!available)("IP 원문은 저장하지 않는다", async () => {
    const db = (await memoryDb())!;
    await createCheer(db, input, { ip: "203.0.113.7", now: NOW });
    const row = await db.prepare("SELECT ip_hash FROM cheers").first<{ ip_hash: string }>();
    expect(row?.ip_hash).not.toContain("203.0.113.7");
  });
});
