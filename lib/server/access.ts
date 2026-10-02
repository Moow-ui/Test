import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 관리자 확인 (서버 전용).
 *
 * 관리자 화면(/admin)과 관리자 API(/api/admin/…)는 Cloudflare Access(Zero Trust) 뒤에 둔다.
 * 코드에 관리자 비밀번호는 없다. Access 가 로그인(이메일 확인)을 마친 요청에만 붙여 주는
 * 서명된 토큰(Cf-Access-Jwt-Assertion)을 여기서 직접 검증한다.
 * 그래서 Access 를 거치지 않는 주소(workers.dev 등)로 들어온 요청은 토큰이 없어 모두 막힌다.
 *
 * 필요한 설정값 (Cloudflare 대시보드 → Worker → 설정 → 변수. 비밀 값이 아니다):
 *   CF_ACCESS_TEAM_DOMAIN  예: myteam.cloudflareaccess.com
 *   CF_ACCESS_AUD          Access 애플리케이션의 "Application Audience (AUD) Tag"
 * 둘 중 하나라도 없으면 아무도 들어올 수 없다.
 */

export const ACCESS_HEADER = "cf-access-jwt-assertion";
export const ACCESS_COOKIE = "CF_Authorization";

export interface AccessKey extends JsonWebKey {
  kid?: string;
}

export interface AccessIdentity {
  email: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseJson(part: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(decoder.decode(fromBase64Url(part)));
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Access 토큰(JWT)을 검증한다. 서명·발급자·대상(AUD)·유효 기간이 모두 맞아야 통과한다.
 * 통과하면 로그인한 사람의 이메일, 아니면 null.
 */
export async function verifyAccessToken(
  token: string,
  options: { issuer: string; audience: string; keys: AccessKey[]; now?: number },
): Promise<AccessIdentity | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = parseJson(headerPart);
  const payload = parseJson(payloadPart);
  if (!header || !payload) return null;

  // 서명 방식은 RS256 만 받는다 ("none" 등으로 바꿔 보낸 토큰을 막는다)
  if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
  const jwk = options.keys.find((k) => k.kid === header.kid);
  if (!jwk) return null;

  let valid = false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      fromBase64Url(signaturePart),
      encoder.encode(`${headerPart}.${payloadPart}`),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  const nowSec = Math.floor((options.now ?? Date.now()) / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) return null;
  if (typeof payload.nbf === "number" && payload.nbf > nowSec) return null;
  if (payload.iss !== options.issuer) return null;
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(options.audience)) return null;

  return { email: typeof payload.email === "string" ? payload.email : "" };
}

/** "myteam", "https://myteam.cloudflareaccess.com/" → "myteam.cloudflareaccess.com" */
export function normalizeTeamDomain(value: string): string {
  const host = value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  if (!host) return "";
  return host.includes(".") ? host : `${host}.cloudflareaccess.com`;
}

async function readConfig(): Promise<{ team: string; audience: string }> {
  let env: Record<string, unknown> = {};
  try {
    env = (await getCloudflareContext({ async: true })).env as unknown as Record<string, unknown>;
  } catch {
    // Cloudflare 밖(테스트 등)에서는 process.env 만 본다
  }
  const pick = (name: string) => {
    const value = env[name] ?? process.env[name];
    return typeof value === "string" ? value.trim() : "";
  };
  return { team: normalizeTeamDomain(pick("CF_ACCESS_TEAM_DOMAIN")), audience: pick("CF_ACCESS_AUD") };
}

/** Access 의 공개 키. Cloudflare 가 주기적으로 바꾸므로 1시간만 기억한다 */
const KEYS_TTL_MS = 60 * 60 * 1000;
/** 잘못된 토큰을 계속 보내도 키를 매번 다시 받지 않도록, 다시 받기는 1분에 한 번까지만 */
const KEYS_RETRY_MS = 60 * 1000;
let cachedKeys: { team: string; at: number; keys: AccessKey[] } | null = null;

async function fetchKeys(team: string, retry = false): Promise<AccessKey[]> {
  const maxAge = retry ? KEYS_RETRY_MS : KEYS_TTL_MS;
  if (cachedKeys && cachedKeys.team === team && Date.now() - cachedKeys.at < maxAge) {
    return cachedKeys.keys;
  }
  const response = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!response.ok) return [];
  const body = (await response.json().catch(() => null)) as { keys?: AccessKey[] } | null;
  const keys = Array.isArray(body?.keys) ? body.keys : [];
  cachedKeys = { team, at: Date.now(), keys };
  return keys;
}

/**
 * 이 요청이 Cloudflare Access 를 통과한 관리자의 요청인가.
 * 내 컴퓨터의 개발 서버(npm run dev)에서만 검사를 건너뛴다. 배포용 빌드에는 이 분기가 들어가지 않는다.
 */
export async function getAdminIdentity(requestHeaders: Headers): Promise<AccessIdentity | null> {
  if (process.env.NODE_ENV === "development") return { email: "dev@localhost" };

  const { team, audience } = await readConfig();
  if (!team || !audience) return null;

  const cookie = requestHeaders
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ACCESS_COOKIE}=`))
    ?.slice(ACCESS_COOKIE.length + 1);
  const token = requestHeaders.get(ACCESS_HEADER) ?? cookie;
  if (!token) return null;

  const options = { issuer: `https://${team}`, audience };
  try {
    const identity = await verifyAccessToken(token, { ...options, keys: await fetchKeys(team) });
    if (identity) return identity;
    // 키가 막 바뀐 직후일 수 있으므로 한 번만 새로 받아 다시 확인한다
    return await verifyAccessToken(token, { ...options, keys: await fetchKeys(team, true) });
  } catch {
    return null;
  }
}
