/**
 * 브랜드 설정 — 사이트 이름과 도메인은 여기 한 곳에만 둔다.
 * 이름을 바꾸려면 아래 name 한 줄만 고치면 로고·title·OG 태그·푸터에 모두 반영된다.
 *
 * 주소는 언어별 경로로 나뉜다: /ko (한국), /en (미국).
 */

/** 사이트 도메인 (하나만 쓴다) */
export const DOMAIN = "exampasso.com";

export const BRAND = {
  ko: { name: "자격증달인" },
  en: { name: "ExamPasso" },
} as const;
