import { z } from "zod";

/** 회원가입·로그인 입력 규칙 (서버와 화면이 함께 쓴다) */

export const USERNAME_RULE = "아이디는 영문 소문자·숫자·밑줄(_)로 4~20자";
export const PASSWORD_RULE = "비밀번호는 8자 이상";
export const NICKNAME_RULE = "닉네임은 1~20자";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{4,20}$/, USERNAME_RULE);

export const passwordSchema = z.string().min(8, PASSWORD_RULE).max(72, "비밀번호는 72자 이하");

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
