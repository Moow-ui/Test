import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/auth-rules";
import { hashPassword, randomToken, sha256, verifyPassword } from "@/lib/server/password";
import { EMPTY_SYNC, mergeSyncData, normalizeSyncData, type SyncData } from "@/lib/sync-merge";

describe("비밀번호 해시", () => {
  it("원문을 저장하지 않고, 맞는 비밀번호만 통과시킨다", async () => {
    const password = randomToken(12);
    const { hash, salt } = await hashPassword(password);
    expect(hash).not.toContain(password);
    expect(await verifyPassword(password, salt, hash)).toBe(true);
    expect(await verifyPassword(`${password}x`, salt, hash)).toBe(false);
  });

  it("같은 비밀번호라도 사람마다 해시가 다르다 (소금)", async () => {
    const password = randomToken(12);
    const a = await hashPassword(password);
    const b = await hashPassword(password);
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
  });

  it("세션 토큰은 추측할 수 없게 길고 매번 다르다", async () => {
    const a = randomToken(32);
    const b = randomToken(32);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(await sha256(a)).not.toBe(a);
    expect(await sha256(a)).toBe(await sha256(a));
  });
});

describe("회원가입 입력 규칙", () => {
  const valid = { username: "worker_01", password: randomToken(9), nickname: "현장반장" };

  it("올바른 입력은 통과하고 아이디는 소문자로 맞춘다", () => {
    const parsed = signupSchema.parse({ ...valid, username: "  Worker_01 " });
    expect(parsed.username).toBe("worker_01");
  });

  it("아이디: 영문 소문자·숫자·밑줄 4~20자", () => {
    expect(signupSchema.safeParse({ ...valid, username: "abc" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, username: "한글아이디" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, username: "a".repeat(21) }).success).toBe(false);
  });

  it("비밀번호 8자 이상, 닉네임 1~20자", () => {
    expect(signupSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, nickname: "  " }).success).toBe(false);
    expect(signupSchema.safeParse({ ...valid, nickname: "가".repeat(21) }).success).toBe(false);
  });

  it("로그인은 빈 값만 막는다", () => {
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "worker_01", password: "" }).success).toBe(false);
  });
});

describe("기록 합치기 (로그인할 때 이 기기 기록 + 계정 기록)", () => {
  const note = (questionId: string, addedAt: number, memo?: string) => ({
    questionId,
    certId: "c",
    chosen: 1,
    addedAt,
    memo,
  });
  const result = (id: string, at: number) => ({
    id,
    certId: "c",
    label: "초급",
    kind: "quiz" as const,
    total: 5,
    correct: 3,
    score: 60,
    at,
    wrongIds: [],
  });
  const owned = (key: string, addedAt: number) => ({ key, name: key, grade: "기능사", year: null, addedAt });

  const local: SyncData = {
    history: {
      q1: { lastSolvedAt: 200, correct: 2, wrong: 0, lastCorrect: true },
      q2: { lastSolvedAt: 50, correct: 0, wrong: 1, lastCorrect: false },
    },
    notes: [note("q2", 60), note("q3", 300)],
    results: [result("r-local", 500)],
    ownedCerts: [owned("electrician-craftsman", 900)],
  };
  const remote: SyncData = {
    history: {
      q1: { lastSolvedAt: 100, correct: 1, wrong: 1, lastCorrect: false },
      q9: { lastSolvedAt: 10, correct: 1, wrong: 0, lastCorrect: true },
    },
    notes: [note("q2", 100, "계정에 적어 둔 메모"), note("q8", 10)],
    results: [result("r-remote", 400), result("r-local", 500)],
    ownedCerts: [owned("electrician-craftsman", 100), owned("forklift-operator", 200)],
  };

  const merged = mergeSyncData(local, remote);

  it("풀이 기록은 문제마다 더 최근에 푼 쪽을 쓴다", () => {
    expect(merged.history.q1.lastSolvedAt).toBe(200);
    expect(merged.history.q1.lastCorrect).toBe(true);
    expect(Object.keys(merged.history).sort()).toEqual(["q1", "q2", "q9"]);
  });

  it("오답노트는 양쪽을 모으고, 메모가 있으면 살린다", () => {
    expect(merged.notes.map((n) => n.questionId)).toEqual(["q3", "q2", "q8"]);
    expect(merged.notes.find((n) => n.questionId === "q2")?.memo).toBe("계정에 적어 둔 메모");
  });

  it("점수 기록은 겹치지 않게 모아 최신순으로", () => {
    expect(merged.results.map((r) => r.id)).toEqual(["r-local", "r-remote"]);
  });

  it("보유 자격증은 겹치지 않게 모은다", () => {
    expect(merged.ownedCerts.map((c) => c.key)).toEqual(["electrician-craftsman", "forklift-operator"]);
    expect(merged.ownedCerts[0].addedAt).toBe(100);
  });

  it("서버 값이 없거나 모양이 달라도 빈 기록으로 처리한다", () => {
    expect(normalizeSyncData(undefined)).toEqual(EMPTY_SYNC);
    expect(normalizeSyncData({ history: [], notes: "x", results: null })).toEqual(EMPTY_SYNC);
    expect(mergeSyncData(local, EMPTY_SYNC).notes).toHaveLength(2);
  });
});
