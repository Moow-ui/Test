import { z } from "zod";

/**
 * 문제 오류 신고 입력 규칙 (서버와 화면이 함께 쓴다).
 * 신고는 로그인 없이 보낼 수 있고, 누가 보냈는지는 저장하지 않는다.
 */

/** 신고 이유 코드. 화면 문구는 messages 의 "report.reasons" 에 있다 */
export const REPORT_REASONS = ["wrong_answer", "bad_question", "bad_explanation", "typo", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_MEMO_MAX = 500;
export const REPORT_STEM_MAX = 80;

export const reportSchema = z.object({
  certId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),
  questionId: z.string().regex(/^[A-Za-z0-9_-]{1,120}$/),
  /** 신고 당시 문제 앞부분 (목록에서 알아보기 위한 용도) */
  stem: z.string().max(REPORT_STEM_MAX),
  reason: z.enum(REPORT_REASONS),
  memo: z.string().trim().max(REPORT_MEMO_MAX),
});

export type ReportInput = z.infer<typeof reportSchema>;
