/**
 * 비밀번호 해시·세션 토큰 (서버 전용).
 * Cloudflare Workers 와 Node 양쪽에 있는 WebCrypto 만 쓴다.
 * 비밀번호는 원문을 저장하지 않고 PBKDF2-SHA256(소금 포함)으로 해시한 값만 저장한다.
 */

// Workers 의 PBKDF2 는 반복 횟수 100,000 까지 지원한다
const ITERATIONS = 100_000;
const KEY_BITS = 256;
const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** 추측할 수 없는 무작위 문자열 (세션 토큰·사용자 id·소금) */
export function randomToken(byteLength = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    KEY_BITS,
  );
  return toBase64Url(new Uint8Array(bits));
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomToken(16);
  return { hash: await derive(password, fromBase64Url(salt)), salt };
}

/** 글자 수가 같을 때 걸리는 시간이 내용에 따라 달라지지 않게 비교한다 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  return safeEqual(await derive(password, fromBase64Url(salt)), hash);
}

/** 세션 토큰은 DB 에 원문 대신 SHA-256 해시로 저장한다 */
export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return toBase64Url(new Uint8Array(digest));
}
