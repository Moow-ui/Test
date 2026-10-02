import { beforeAll, describe, expect, it } from "vitest";
import { reportSchema } from "@/lib/report-rules";
import { normalizeTeamDomain, verifyAccessToken, type AccessKey } from "@/lib/server/access";
import { formatKst, kstDayStart, kstWeekStart } from "@/lib/server/admin";

const ISSUER = "https://myteam.cloudflareaccess.com";
const AUDIENCE = "aud-of-admin-app";
const NOW = Date.UTC(2026, 9, 2, 3, 0, 0); // 2026-10-02 12:00 (한국 시간, 금요일)

const b64 = (data: string | ArrayBuffer) =>
  Buffer.from(typeof data === "string" ? data : new Uint8Array(data)).toString("base64url");

async function makeKey(kid: string) {
  const pair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const jwk: AccessKey = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid };
  return { privateKey: pair.privateKey, jwk };
}

async function sign(privateKey: CryptoKey, header: object, payload: object): Promise<string> {
  const body = `${b64(JSON.stringify(header))}.${b64(JSON.stringify(payload))}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(body));
  return `${body}.${b64(signature)}`;
}

describe("관리자 확인 (Cloudflare Access 토큰)", () => {
  let access: Awaited<ReturnType<typeof makeKey>>;
  let stranger: Awaited<ReturnType<typeof makeKey>>;
  const header = { alg: "RS256", kid: "k1" };
  const payload = {
    iss: ISSUER,
    aud: [AUDIENCE],
    email: "owner@example.com",
    exp: Math.floor(NOW / 1000) + 600,
  };
  const check = (token: string, audience = AUDIENCE) =>
    verifyAccessToken(token, { issuer: ISSUER, audience, keys: [access.jwk], now: NOW });

  beforeAll(async () => {
    access = await makeKey("k1");
    stranger = await makeKey("k1");
  });

  it("Access 가 서명한 올바른 토큰만 통과한다", async () => {
    expect(await check(await sign(access.privateKey, header, payload))).toEqual({ email: "owner@example.com" });
  });

  it("토큰이 없거나 모양이 다르면 막는다", async () => {
    expect(await check("")).toBeNull();
    expect(await check("a.b.c")).toBeNull();
    expect(await check("not-a-token")).toBeNull();
  });

  it("다른 키로 서명했거나 내용을 고친 토큰은 막는다", async () => {
    expect(await check(await sign(stranger.privateKey, header, payload))).toBeNull();
    const [h, , s] = (await sign(access.privateKey, header, payload)).split(".");
    const forged = b64(JSON.stringify({ ...payload, email: "attacker@example.com" }));
    expect(await check(`${h}.${forged}.${s}`)).toBeNull();
  });

  it("서명 없는 토큰(alg: none)은 막는다", async () => {
    const unsigned = `${b64(JSON.stringify({ alg: "none", kid: "k1" }))}.${b64(JSON.stringify(payload))}.`;
    expect(await check(unsigned)).toBeNull();
  });

  it("기간이 지났거나, 다른 Access 앱·다른 팀의 토큰은 막는다", async () => {
    const expired = { ...payload, exp: Math.floor(NOW / 1000) - 1 };
    expect(await check(await sign(access.privateKey, header, expired))).toBeNull();
    expect(await check(await sign(access.privateKey, header, { ...payload, aud: ["other-app"] }))).toBeNull();
    const otherTeam = { ...payload, iss: "https://other.cloudflareaccess.com" };
    expect(await check(await sign(access.privateKey, header, otherTeam))).toBeNull();
    expect(await check(await sign(access.privateKey, header, payload), "")).toBeNull();
  });

  it("팀 주소는 어떤 모양으로 적어도 같은 값이 된다", () => {
    expect(normalizeTeamDomain("myteam")).toBe("myteam.cloudflareaccess.com");
    expect(normalizeTeamDomain(" https://MyTeam.cloudflareaccess.com/ ")).toBe("myteam.cloudflareaccess.com");
    expect(normalizeTeamDomain("")).toBe("");
  });
});

describe("가입자 수의 오늘·이번 주 (한국 시간)", () => {
  it("오늘 0시와 이번 주 월요일 0시를 구한다", () => {
    expect(formatKst(NOW)).toBe("2026-10-02 12:00");
    expect(formatKst(kstDayStart(NOW))).toBe("2026-10-02 00:00");
    expect(formatKst(kstWeekStart(NOW))).toBe("2026-09-28 00:00");
    // 일요일 밤은 그 주에, 월요일 0시는 새 주에 들어간다
    const sundayNight = Date.UTC(2026, 9, 4, 14, 59); // 10-04 23:59 KST
    expect(formatKst(kstWeekStart(sundayNight))).toBe("2026-09-28 00:00");
    expect(formatKst(kstWeekStart(sundayNight + 60_000))).toBe("2026-10-05 00:00");
  });
});

describe("문제 오류 신고 입력 규칙", () => {
  const valid = {
    certId: "electrician-craftsman",
    questionId: "electrician-craftsman-dc-circuit-0001",
    stem: "정전용량이",
    reason: "typo",
    memo: " 오타 ",
  };

  it("올바른 신고는 통과하고 메모 앞뒤 공백을 지운다", () => {
    expect(reportSchema.parse(valid).memo).toBe("오타");
  });

  it("모르는 이유, 너무 긴 메모, 이상한 id 는 막는다", () => {
    expect(reportSchema.safeParse({ ...valid, reason: "spam" }).success).toBe(false);
    expect(reportSchema.safeParse({ ...valid, memo: "가".repeat(501) }).success).toBe(false);
    expect(reportSchema.safeParse({ ...valid, questionId: "x'; DROP TABLE users;--" }).success).toBe(false);
  });
});
