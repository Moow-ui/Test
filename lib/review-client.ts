import type { ReviewInput, ReviewItem, ReviewPage } from "./review-rules";

/** 자격증 후기·주간 풀이 횟수 API 호출 (클라이언트 전용). 실패하면 오류 코드 (화면 문구는 messages 의 "errors") */

async function post(url: string, body: unknown, keepalive = false): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      keepalive,
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: response.ok, body: data };
  } catch {
    return { ok: false, body: { error: "network" } };
  }
}

const errorOf = (body: Record<string, unknown>) => (typeof body.error === "string" ? body.error : "unknown");

/** 후기 한 쪽을 받는다. before 는 지금까지 받은 마지막 후기의 작성 시각. 실패하면 null */
export async function fetchReviews(certId: string, before?: number): Promise<ReviewPage | null> {
  try {
    const query = new URLSearchParams({ cert: certId });
    if (before) query.set("before", String(before));
    const response = await fetch(`/api/reviews?${query}`, { credentials: "same-origin", cache: "no-store" });
    return response.ok ? ((await response.json()) as ReviewPage) : null;
  } catch {
    return null;
  }
}

/** 후기를 보낸다. 성공하면 저장된 후기, 실패하면 오류 코드 */
export async function sendReview(input: ReviewInput & { token: string }): Promise<{ review: ReviewItem } | { error: string }> {
  const { ok, body } = await post("/api/reviews", input);
  return ok && body.review ? { review: body.review as ReviewItem } : { error: errorOf(body) };
}

/** 후기를 신고한다. 성공하면 true */
export async function flagReview(id: string): Promise<boolean> {
  return (await post("/api/reviews/flag", { id })).ok;
}

/** 문제 풀이를 끝냈음을 알린다 (자격증의 주간 풀이 횟수만 1 오른다. 실패해도 풀이에는 영향이 없다) */
export function reportSolve(certId: string): void {
  void post("/api/activity", { certId }, true);
}

/** 관리자 화면: 후기 숨기기 / 다시 보이기 / 삭제. 성공하면 true */
export async function setReviewState(id: string, action: "hide" | "show" | "delete"): Promise<boolean> {
  return (await post("/api/admin/reviews", { id, action })).ok;
}
