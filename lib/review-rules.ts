import { z } from "zod";

/**
 * 자격증 후기 입력 규칙 (서버와 화면이 함께 쓴다).
 * 후기는 이용자가 직접 쓴 글만 싣는다. AI·운영진이 쓴 글을 후기로 넣지 않는다.
 * 검증 오류는 문장이 아니라 코드로 돌려준다. 화면 문구는 messages 의 "errors" 에 있다.
 */

/** 글쓴이의 지금 상태. 화면 문구는 messages 의 "reviews.statuses" */
export const REVIEW_STATUSES = ["studying", "passed", "failed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 300;
export const REVIEW_NICKNAME_MAX = 20;
/** 한 번에 보여 주는 후기 수 (최신순, 나머지는 "더 보기") */
export const REVIEW_PAGE_SIZE = 10;
/** 후기가 이 수 이상일 때만 평균 별점을 보여 준다 */
export const REVIEW_AVERAGE_MIN = 5;
/** 같은 IP 에서 하루(한국 시간)에 쓸 수 있는 후기 수 */
export const REVIEWS_PER_IP_PER_DAY = 3;
/** 신고가 이 수에 이르면 자동으로 숨긴다 */
export const REVIEW_FLAGS_TO_HIDE = 3;
/** 이번 주 풀이 횟수가 이 수 이상일 때만 화면에 보여 준다 (부풀리거나 초깃값을 넣지 않는다) */
export const ACTIVITY_MIN_TO_SHOW = 20;

const LINK_PATTERN =
  /https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|kr|co|io|me|xyz|info|biz|shop|site|top|link|ly|gl|cc|tv|app)\b/i;

const PHONE_PATTERNS = [
  /\d{9,}/, // 붙여 쓴 긴 숫자
  /\+?\d{1,3}[-.\s]?\(?\d{2,3}\)?[-.\s]\d{3,4}[-.\s]\d{4}/, // +82 10-1234-5678, +1 (415) 555-1234
  /\(?0\d{1,2}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/, // 010-1234-5678, 02 123 4567
  /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/, // (415) 555-1234
];

/** 기본 금칙어 (욕설·도박·성인·메신저 유도). 띄어쓰기·기호를 사이에 넣어도 걸리도록 글자만 남겨 비교한다 */
const BANNED_KO = [
  "씨발",
  "시발",
  "ㅅㅂ",
  "병신",
  "ㅂㅅ",
  "지랄",
  "좆",
  "개새끼",
  "미친놈",
  "미친년",
  "카지노",
  "바카라",
  "토토",
  "도박",
  "야동",
  "섹스",
  "텔레그램",
  "카카오톡",
  "카톡",
  "오픈채팅",
];
/** 영어는 다른 낱말의 일부일 수 있어 낱말 단위로만 본다 */
const BANNED_EN = /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|casino|porn\w*|viagra|telegram|whatsapp)\b/i;

export function hasLink(text: string): boolean {
  return LINK_PATTERN.test(text.normalize("NFKC"));
}

export function hasPhoneNumber(text: string): boolean {
  const normalized = text.normalize("NFKC");
  return PHONE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function hasBannedWord(text: string): boolean {
  const normalized = text.normalize("NFKC").toLowerCase();
  if (BANNED_EN.test(normalized)) return true;
  const lettersOnly = normalized.replace(/[^\p{L}\p{N}]/gu, "");
  return BANNED_KO.some((word) => lettersOnly.includes(word));
}

/** 링크·전화번호·금칙어가 들어 있으면 오류 코드, 없으면 null */
export function textProblem(text: string): string | null {
  if (hasLink(text)) return "review_link";
  if (hasPhoneNumber(text)) return "review_phone";
  if (hasBannedWord(text)) return "review_banned";
  return null;
}

const shapeSchema = z.object({
  certId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000),
  status: z.enum(REVIEW_STATUSES),
  nickname: z.string().max(200),
});

export interface ReviewInput {
  certId: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  nickname: string;
}

/** 글자 수 (이모지 등도 한 글자로 센다) */
export function textLength(text: string): number {
  return [...text].length;
}

/** 후기는 한 줄이다: 줄바꿈·연속 공백을 한 칸으로 줄인다 */
export function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** 후기 입력을 검사한다. 통과하면 다듬은 값, 아니면 오류 코드 */
export function checkReview(input: unknown): { data: ReviewInput } | { error: string } {
  const parsed = shapeSchema.safeParse(input);
  if (!parsed.success) return { error: "bad_request" };
  const body = oneLine(parsed.data.body);
  const nickname = oneLine(parsed.data.nickname);
  const length = textLength(body);
  if (length < REVIEW_BODY_MIN || length > REVIEW_BODY_MAX) return { error: "review_length" };
  const nicknameLength = textLength(nickname);
  if (nicknameLength < 1 || nicknameLength > REVIEW_NICKNAME_MAX) return { error: "nickname_rule" };
  const problem = textProblem(body) ?? textProblem(nickname);
  if (problem) return { error: problem };
  return { data: { ...parsed.data, body, nickname } };
}

/** 화면에 보여 주는 후기 한 건 */
export interface ReviewItem {
  id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  nickname: string;
  createdAt: number;
}

/** GET /api/reviews 의 응답 */
export interface ReviewPage {
  reviews: ReviewItem[];
  /** 보이는 후기 전체 수 */
  total: number;
  /** 평균 별점 (소수 첫째 자리). 후기가 REVIEW_AVERAGE_MIN 개 미만이면 null */
  average: number | null;
  hasMore: boolean;
  /** 이번 주 풀이 횟수. ACTIVITY_MIN_TO_SHOW 미만이면 null */
  weekSolves: number | null;
  /** 후기 작성 폼. open=false 면 아직 받을 수 없는 상태, siteKey 가 있으면 사람 확인(Turnstile)을 거친다 */
  form: { open: boolean; siteKey: string | null };
}
