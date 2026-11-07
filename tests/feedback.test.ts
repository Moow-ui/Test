import { describe, expect, it } from "vitest";
import { FEEDBACK_PER_IP_PER_DAY, checkFeedback } from "@/lib/feedback-rules";
import type { D1Like, D1Statement } from "@/lib/server/db";
import { createFeedback, getAdminFeedback, setFeedbackState } from "@/lib/server/feedback";

describe("개선 의견 입력 규칙", () => {
  it("줄바꿈은 살리고 줄마다 공백을 정리한다", () => {
    expect(checkFeedback({ locale: "ko", body: "  글자가 작아요  \n\n\n\n  버튼을   키워 주세요 " })).toEqual({
      data: { locale: "ko", body: "글자가 작아요\n\n버튼을 키워 주세요" },
    });
  });

  it("10~1000자, 링크·전화번호는 거부한다", () => {
    expect(checkFeedback({ locale: "ko", body: "불편해요" })).toEqual({ error: "feedback_length" });
    expect(checkFeedback({ locale: "ko", body: "가".repeat(1001) })).toEqual({ error: "feedback_length" });
    expect(checkFeedback({ locale: "ko", body: "가".repeat(1000) })).toHaveProperty("data");
    expect(checkFeedback({ locale: "ko", body: "여기 보세요 https://spam.example.com" })).toEqual({ error: "review_link" });
    expect(checkFeedback({ locale: "ko", body: "연락 주세요 010-1234-5678 부탁" })).toEqual({ error: "review_phone" });
    expect(checkFeedback({ locale: "fr", body: "글자가 작아요 키워 주세요" })).toEqual({ error: "bad_request" });
  });
});

async function memoryDb(): Promise<D1Like | null> {
  let sqlite: typeof import("node:sqlite");
  try {
    sqlite = await import("node:sqlite");
  } catch {
    return null;
  }
  const raw = new sqlite.DatabaseSync(":memory:");
  raw.exec(`CREATE TABLE feedback (id TEXT PRIMARY KEY, locale TEXT NOT NULL, body TEXT NOT NULL, ip_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL, resolved_at INTEGER)`);
  const statement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...next) => statement(query, next),
    first: async <T>() => (raw.prepare(query).get(...(values as never[])) as T | undefined) ?? null,
    run: async () => raw.prepare(query).run(...(values as never[])),
    all: async <T>() => ({ results: raw.prepare(query).all(...(values as never[])) as T[] }),
  });
  return { prepare: (query) => statement(query), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const NOW = Date.UTC(2026, 10, 7, 3, 0, 0);
const input = { locale: "ko" as const, body: "글자가 작아요. 키워 주세요." };

describe("개선 의견 저장·처리 (DB)", async () => {
  const available = (await memoryDb()) !== null;

  it.skipIf(!available)("같은 IP 는 하루 5개까지, 처리 전 의견이 먼저 나온다", async () => {
    const db = (await memoryDb())!;
    for (let i = 0; i < FEEDBACK_PER_IP_PER_DAY; i++) {
      expect(await createFeedback(db, input, { ip: "1.1.1.1", now: NOW + i })).toEqual({ ok: true });
    }
    expect(await createFeedback(db, input, { ip: "1.1.1.1", now: NOW + 10 })).toEqual({ error: "feedback_limit" });

    const first = await getAdminFeedback(db);
    expect(first).toMatchObject({ total: 5, open: 5 });
    const newest = first.items[0];
    await setFeedbackState(db, newest.id, "done", NOW + 100);
    const after = await getAdminFeedback(db);
    expect(after.open).toBe(4);
    expect(after.items[after.items.length - 1].id).toBe(newest.id);

    await setFeedbackState(db, newest.id, "undo");
    expect((await getAdminFeedback(db)).open).toBe(5);
    await setFeedbackState(db, newest.id, "delete");
    expect((await getAdminFeedback(db)).total).toBe(4);
  });
});
