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

/**
 * 아래 값들은 모두 "빌드할 때" 읽는다 (모든 페이지가 빌드 때 만들어지는 정적 페이지라서).
 * Cloudflare 에서는 Worker → Settings → Build → Variables and secrets 에 넣고 다시 배포해야 반영된다.
 */

/** 문의 이메일 (CONTACT_EMAIL). 없으면 안내 페이지에 "준비 중"으로 나온다. 서버 컴포넌트에서만 쓴다 */
export const CONTACT_EMAIL = (process.env.CONTACT_EMAIL ?? "").trim() || null;

/**
 * 검색엔진 소유확인 값 (HTML 태그 방식의 content="..." 값).
 * 공개되는 값이라 코드에 적어 두어도 된다. 환경변수가 있으면 그 값이 우선한다.
 */
export const SITE_VERIFICATION = {
  google: process.env.GOOGLE_SITE_VERIFICATION || "",
  naver: process.env.NAVER_SITE_VERIFICATION || "21aa36f53ce1d0717b80a76e0c6ed23121b1884d",
  bing: process.env.BING_SITE_VERIFICATION || "",
};

/** "ca-pub-123", "pub-123", "123" 어느 모양으로 넣어도 게시자 번호만 꺼낸다 */
export function adsensePublisherNumber(raw: string | undefined): string | null {
  const match = (raw ?? "").trim().match(/^(?:ca-)?(?:pub-)?(\d+)$/);
  return match ? match[1] : null;
}

const adsenseNumber = adsensePublisherNumber(process.env.NEXT_PUBLIC_ADSENSE_ID);

/** 애드센스 광고 코드용 id ("ca-pub-…"). NEXT_PUBLIC_ADSENSE_ID 가 없으면 null 이고 광고를 그리지 않는다 */
export const ADSENSE_CLIENT = adsenseNumber ? `ca-pub-${adsenseNumber}` : null;

/** 광고 자리 미리보기. NEXT_PUBLIC_SHOW_AD_SLOTS=1 이면 광고 id 가 없어도 자리를 점선 상자로 보여 준다 */
export const SHOW_AD_SLOTS = process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "1";
