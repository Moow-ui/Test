import { z } from "zod";
import { LOCALES, type Locale } from "./i18n";
import { oneLine, textLength, textProblem } from "./review-rules";

/**
 * 개선 의견 입력 규칙 (서버와 화면이 함께 쓴다).
 * 개선 의견은 공개하지 않는다. 관리자 화면(/admin "개선 의견")에서만 읽는다.
 */

export const FEEDBACK_BODY_MIN = 10;
export const FEEDBACK_BODY_MAX = 1000;
/** 같은 IP 에서 하루(한국 시간)에 보낼 수 있는 의견 수 */
export const FEEDBACK_PER_IP_PER_DAY = 5;

const shapeSchema = z.object({
  locale: z.enum(LOCALES),
  body: z.string().max(5000),
});

export interface FeedbackInput {
  locale: Locale;
  body: string;
}

/** 개선 의견을 검사한다. 통과하면 다듬은 값, 아니면 오류 코드 (화면 문구는 messages 의 "errors") */
export function checkFeedback(input: unknown): { data: FeedbackInput } | { error: string } {
  const parsed = shapeSchema.safeParse(input);
  if (!parsed.success) return { error: "bad_request" };
  // 의견은 줄을 나눠 쓸 수 있다: 줄마다 공백만 정리하고 빈 줄은 하나로 줄인다
  const body = parsed.data.body
    .split(/\r?\n/)
    .map(oneLine)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const length = textLength(body);
  if (length < FEEDBACK_BODY_MIN || length > FEEDBACK_BODY_MAX) return { error: "feedback_length" };
  const problem = textProblem(body);
  if (problem) return { error: problem };
  return { data: { locale: parsed.data.locale, body } };
}
