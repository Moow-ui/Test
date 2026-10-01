import { DOMAIN } from "@/config/brand";

/**
 * 사이트 공통 설정.
 * 사이트 이름은 config/brand.ts, 화면 문구는 messages/{ko,en}.json 에 있다.
 */

/**
 * 사이트 주소 (canonical, hreflang, sitemap, OG 이미지 주소가 모두 이 값을 쓴다).
 * 배포할 때는 config/brand.ts 의 도메인을 쓰고, 다른 주소로 시험할 때만 NEXT_PUBLIC_SITE_URL 로 바꾼다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? `https://${DOMAIN}` : "http://localhost:3000")
).replace(/\/+$/, "");

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/** 광고 자리 미리보기 (실제 광고는 아직 넣지 않음). NEXT_PUBLIC_SHOW_AD_SLOTS=1 이면 자리 표시 */
export const SHOW_AD_SLOTS = process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "1";
