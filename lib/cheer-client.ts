import type { CheerInput, CheerItem } from "./cheer-rules";
import type { Locale } from "./i18n";

/** 응원 API 호출 (클라이언트 전용). 실패하면 오류 코드 (화면 문구는 messages 의 "errors") */

async function post(url: string, body: unknown): Promise<{ ok: boolean; error: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => ({}))) as { error?: unknown };
    return { ok: response.ok, error: typeof data.error === "string" ? data.error : "unknown" };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** 공개된 응원 목록. 실패하면 빈 목록 */
export async function fetchPublicCheers(locale: Locale): Promise<CheerItem[]> {
  try {
    const response = await fetch(`/api/cheers?lang=${locale}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { cheers?: CheerItem[] };
    return Array.isArray(data.cheers) ? data.cheers : [];
  } catch {
    return [];
  }
}

/** 응원을 보낸다. 성공하면 null, 실패하면 오류 코드 */
export async function sendCheer(input: CheerInput): Promise<string | null> {
  const result = await post("/api/cheers", input);
  return result.ok ? null : result.error;
}

/** 관리자 화면: 응원 공개 / 비공개 / 삭제. 성공하면 true */
export async function setCheerState(id: string, action: "publish" | "unpublish" | "delete"): Promise<boolean> {
  return (await post("/api/admin/cheers", { id, action })).ok;
}
