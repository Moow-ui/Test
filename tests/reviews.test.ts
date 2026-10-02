import { describe, expect, it } from "vitest";
import { getCertList, getCertification } from "@/lib/data";
import {
  ACTIVITY_MIN_TO_SHOW,
  REVIEWS_PER_IP_PER_DAY,
  REVIEW_AVERAGE_MIN,
  REVIEW_FLAGS_TO_HIDE,
  REVIEW_PAGE_SIZE,
  checkReview,
  hasBannedWord,
  hasLink,
  hasPhoneNumber,
} from "@/lib/review-rules";
import type { D1Like, D1Statement } from "@/lib/server/db";
import { addSolve, createReview, flagReview, listReviews, reviewStats, weekSolves } from "@/lib/server/reviews";

const valid = {
  certId: "electrician-craftsman",
  rating: 4,
  body: "  하루 5문제씩 풀었더니\n도움이 됐어요  ",
  status: "studying",
  nickname: " 전기초보 ",
};

describe("후기 입력 규칙", () => {
  it("올바른 후기는 통과하고 한 줄로 다듬는다", () => {
    expect(checkReview(valid)).toEqual({
      data: { ...valid, body: "하루 5문제씩 풀었더니 도움이 됐어요", nickname: "전기초보" },
    });
  });

  it("별점 1~5, 10~300자, 정해진 상태, 닉네임 1~20자만 받는다", () => {
    const check = (patch: object) => checkReview({ ...valid, ...patch });
    expect(check({ rating: 0 })).toEqual({ error: "bad_request" });
    expect(check({ rating: 6 })).toEqual({ error: "bad_request" });
    expect(check({ rating: 4.5 })).toEqual({ error: "bad_request" });
    expect(check({ status: "expert" })).toEqual({ error: "bad_request" });
    expect(check({ certId: "x; DROP TABLE reviews;--" })).toEqual({ error: "bad_request" });
    expect(check({ body: "짧아요" })).toEqual({ error: "review_length" });
    expect(check({ body: "가".repeat(301) })).toEqual({ error: "review_length" });
    expect(check({ body: "가".repeat(300) })).toHaveProperty("data");
    expect(check({ nickname: "  " })).toEqual({ error: "nickname_rule" });
    expect(check({ nickname: "가".repeat(21) })).toEqual({ error: "nickname_rule" });
  });

  it("링크가 들어 있으면 거부한다", () => {
    expect(hasLink("자료는 https://example.com 에 있어요")).toBe(true);
    expect(hasLink("www.example.kr 참고하세요")).toBe(true);
    expect(hasLink("example.com 가 보세요")).toBe(true);
    expect(hasLink("3.5점 정도. 문제가 좋아요")).toBe(false);
    expect(checkReview({ ...valid, body: "합격 자료 받아 가세요 bit.ly/abc123" })).toEqual({ error: "review_link" });
  });

  it("전화번호가 들어 있으면 거부한다", () => {
    expect(hasPhoneNumber("문의 010-1234-5678 로 주세요")).toBe(true);
    expect(hasPhoneNumber("문의 01012345678")).toBe(true);
    expect(hasPhoneNumber("call (415) 555-1234 now")).toBe(true);
    expect(hasPhoneNumber("+82 10 1234 5678")).toBe(true);
    expect(hasPhoneNumber("2026년 10월에 60문항 중 48문항 맞혔어요")).toBe(false);
    expect(hasPhoneNumber("3회차에 85점으로 합격")).toBe(false);
    expect(checkReview({ ...valid, body: "과외 문의는 010 1234 5678 입니다" })).toEqual({ error: "review_phone" });
  });

  it("금칙어가 들어 있으면 거부한다 (띄어 써도, 닉네임에 넣어도)", () => {
    expect(hasBannedWord("카 지 노 추천")).toBe(true);
    expect(hasBannedWord("This is SHIT")).toBe(true);
    expect(hasBannedWord("Great class, passed on the first try")).toBe(false);
    expect(hasBannedWord("문제가 실제 시험과 비슷해서 좋았어요")).toBe(false);
    expect(checkReview({ ...valid, nickname: "바카라" })).toEqual({ error: "review_banned" });
  });
});

describe("운영진 학습 팁", () => {
  it("문제가 있는 자격증에는 모두 팁 3개가 들어 있다", async () => {
    for (const item of await getCertList()) {
      if (!item.ready) continue;
      const cert = await getCertification(item.id);
      expect(Object.keys(cert?.studyTips ?? {}).sort(), item.id).toEqual(["examDay", "hardChapters", "studyOrder"]);
    }
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
    CREATE TABLE reviews (id TEXT PRIMARY KEY, cert_id TEXT NOT NULL, rating INTEGER NOT NULL, body TEXT NOT NULL,
      status TEXT NOT NULL, nickname TEXT NOT NULL, user_id TEXT, ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL,
      hidden INTEGER NOT NULL DEFAULT 0, report_count INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE review_flags (review_id TEXT NOT NULL, ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY (review_id, ip_hash));
    CREATE TABLE quiz_activity (cert_id TEXT NOT NULL, week_start INTEGER NOT NULL, count INTEGER NOT NULL,
      PRIMARY KEY (cert_id, week_start));
  `);
  const statement = (query: string, values: unknown[] = []): D1Statement => ({
    bind: (...next) => statement(query, next),
    first: async <T>() => (raw.prepare(query).get(...(values as never[])) as T | undefined) ?? null,
    run: async () => raw.prepare(query).run(...(values as never[])),
    all: async <T>() => ({ results: raw.prepare(query).all(...(values as never[])) as T[] }),
  });
  return { prepare: (query) => statement(query), batch: async (list) => Promise.all(list.map((s) => s.run())) };
}

const NOW = Date.UTC(2026, 9, 2, 3, 0, 0); // 2026-10-02 12:00 (한국 시간, 금요일)
const DAY = 24 * 60 * 60 * 1000;
const input = {
  certId: "electrician-craftsman",
  rating: 4,
  body: "하루 5문제씩 풀었더니 도움이 됐어요",
  status: "studying" as const,
  nickname: "전기초보",
};

describe("후기 저장·신고·주간 풀이 횟수 (DB)", async () => {
  const available = (await memoryDb()) !== null;

  it.skipIf(!available)("같은 IP 는 하루 3개까지만 쓸 수 있고, 다음 날에는 다시 쓸 수 있다", async () => {
    const db = (await memoryDb())!;
    for (let i = 0; i < REVIEWS_PER_IP_PER_DAY; i++) {
      expect(await createReview(db, input, { ip: "1.1.1.1", userId: null, now: NOW + i })).toHaveProperty("review");
    }
    expect(await createReview(db, input, { ip: "1.1.1.1", userId: null, now: NOW + 10 })).toEqual({
      error: "review_limit",
    });
    expect(await createReview(db, input, { ip: "2.2.2.2", userId: null, now: NOW + 11 })).toHaveProperty("review");
    expect(await createReview(db, input, { ip: "1.1.1.1", userId: null, now: NOW + DAY })).toHaveProperty("review");
  });

  it.skipIf(!available)("최신순 10개씩 주고, 평균 별점은 5개 이상일 때만 준다", async () => {
    const db = (await memoryDb())!;
    for (let i = 0; i < REVIEW_AVERAGE_MIN - 1; i++) {
      await createReview(db, { ...input, rating: 5 }, { ip: `10.0.0.${i}`, userId: null, now: NOW + i });
    }
    expect(await reviewStats(db, input.certId)).toEqual({ total: REVIEW_AVERAGE_MIN - 1, average: null });
    for (let i = 0; i < 8; i++) {
      await createReview(db, { ...input, rating: 2 }, { ip: `10.0.1.${i}`, userId: null, now: NOW + 100 + i });
    }
    expect(await reviewStats(db, input.certId)).toEqual({ total: 12, average: 3 });
    expect(await reviewStats(db, "forklift-operator")).toEqual({ total: 0, average: null });

    const first = await listReviews(db, input.certId, null);
    expect(first.reviews).toHaveLength(REVIEW_PAGE_SIZE);
    expect(first.hasMore).toBe(true);
    expect(first.reviews[0].createdAt).toBe(NOW + 107);
    const second = await listReviews(db, input.certId, first.reviews[REVIEW_PAGE_SIZE - 1].createdAt);
    expect(second.reviews).toHaveLength(2);
    expect(second.hasMore).toBe(false);
  });

  it.skipIf(!available)("서로 다른 3곳에서 신고하면 자동으로 숨긴다 (같은 곳의 신고는 1번)", async () => {
    const db = (await memoryDb())!;
    const created = await createReview(db, input, { ip: "1.1.1.1", userId: null, now: NOW });
    if (!("review" in created)) throw new Error("save failed");
    const id = created.review.id;
    expect(await flagReview(db, "no-such-review", "9.9.9.1")).toBeNull();
    for (let i = 0; i < 5; i++) expect(await flagReview(db, id, "9.9.9.1")).toEqual({ hidden: false });
    expect(await flagReview(db, id, "9.9.9.2")).toEqual({ hidden: false });
    expect((await listReviews(db, input.certId, null)).reviews).toHaveLength(1);
    expect(REVIEW_FLAGS_TO_HIDE).toBe(3);
    expect(await flagReview(db, id, "9.9.9.3")).toEqual({ hidden: true });
    expect((await listReviews(db, input.certId, null)).reviews).toHaveLength(0);
    expect(await reviewStats(db, input.certId)).toEqual({ total: 0, average: null });
  });

  it.skipIf(!available)("주간 풀이 횟수는 20회부터 보여 주고, 주가 바뀌면 0부터 다시 센다", async () => {
    const db = (await memoryDb())!;
    expect(await weekSolves(db, input.certId, NOW)).toBeNull();
    for (let i = 0; i < ACTIVITY_MIN_TO_SHOW - 1; i++) await addSolve(db, input.certId, NOW);
    expect(await weekSolves(db, input.certId, NOW)).toBeNull();
    await addSolve(db, input.certId, NOW);
    expect(await weekSolves(db, input.certId, NOW)).toBe(ACTIVITY_MIN_TO_SHOW);
    expect(await weekSolves(db, "forklift-operator", NOW)).toBeNull();
    expect(await weekSolves(db, input.certId, NOW + 7 * DAY)).toBeNull();
  });
});
