import type { ReportInput } from "./report-rules";

/** 문제 오류 신고를 서버에 보낸다 (클라이언트 전용). 성공하면 null, 실패하면 오류 코드 (화면 문구는 messages 의 "errors") */
export async function sendReport(report: ReportInput): Promise<string | null> {
  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      credentials: "same-origin",
    });
    if (response.ok) return null;
    const body = (await response.json().catch(() => ({}))) as { error?: unknown };
    return typeof body.error === "string" ? body.error : "unknown";
  } catch {
    return "network";
  }
}

/** 관리자 화면: 신고를 처리 완료 / 처리 전으로 표시한다. 성공하면 true */
export async function setReportResolved(id: string, resolved: boolean): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved }),
      credentials: "same-origin",
    });
    return response.ok;
  } catch {
    return false;
  }
}
