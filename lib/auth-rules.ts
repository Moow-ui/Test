import { z } from "zod";

/**
 * 회원가입·로그인 입력 규칙 (서버와 화면이 함께 쓴다).
 * 검증 오류는 문장이 아니라 코드로 돌려준다. 화면 문구는 messages 의 "errors" 에 있다.
 */

export const USERNAME_RULE = "username_rule";
export const PASSWORD_RULE = "password_rule";
export const NICKNAME_RULE = "nickname_rule";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{4,20}$/, USERNAME_RULE);

export const passwordSchema = z.string().min(8, PASSWORD_RULE).max(72, "password_too_long");

export const nicknameSchema = z.string().trim().min(1, NICKNAME_RULE).max(20, NICKNAME_RULE);

export const signupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  nickname: nicknameSchema,
});

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(40),
  password: z.string().min(1).max(200),
});

export interface AuthUser {
  id: string;
  username: string;
  nickname: string;
}

/** 로그인 연속 실패 허용 횟수와 잠금 시간 */
export const MAX_LOGIN_FAILS = 5;
export const LOCK_MINUTES = 5;
