import { z } from "zod";
import { LOCALES, type Locale } from "./i18n";
import { oneLine, textLength, textProblem } from "./review-rules";

/**
 * 응원 한마디 입력 규칙 (서버와 화면이 함께 쓴다). 자격증 후기와는 따로 저장한다.
 * 응원 글은 처음에 비공개이고, 관리자가 [공개]를 누른 글만 응원 페이지에 보인다.
 * 운영진·AI 가 응원 글을 써 넣지 않는다. 공개할 때도 내용은 고치지 않는다.
 */

export const CHEER_BODY_MIN = 10;
export const CHEER_BODY_MAX = 300;
export const CHEER_NICKNAME_MAX = 20;
/** 같은 IP 에서 하루(한국 시간)에 남길 수 있는 응원 수 */
export const CHEERS_PER_IP_PER_DAY = 3;
/** 응원 페이지에 보여 주는 공개 응원 수 (최신순) */
export const CHEER_PUBLIC_LIMIT = 50;

const shapeSchema = z.object({
  locale: z.enum(LOCALES),
  body: z.string().max(2000),
  nickname: z.string().max(200),
});

export interface CheerInput {
  locale: Locale;
  body: string;
  /** 비워 두면 "" (화면에는 "익명"으로 보인다) */
  nickname: string;
}

/** 응원 입력을 검사한다. 통과하면 다듬은 값, 아니면 오류 코드 (화면 문구는 messages 의 "errors") */
export function checkCheer(input: unknown): { data: CheerInput } | { error: string } {
  const parsed = shapeSchema.safeParse(input);
  if (!parsed.success) return { error: "bad_request" };
  const body = oneLine(parsed.data.body);
  const nickname = oneLine(parsed.data.nickname);
  const length = textLength(body);
  if (length < CHEER_BODY_MIN || length > CHEER_BODY_MAX) return { error: "cheer_length" };
  if (textLength(nickname) > CHEER_NICKNAME_MAX) return { error: "cheer_nickname" };
  const problem = textProblem(body) ?? (nickname ? textProblem(nickname) : null);
  if (problem) return { error: problem };
  return { data: { locale: parsed.data.locale, body, nickname } };
}

/** 응원 페이지에 보이는 응원 한 건 */
export interface CheerItem {
  id: string;
  body: string;
  nickname: string;
  createdAt: number;
}
