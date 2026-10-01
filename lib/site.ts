/** 사이트 공통 설정 */

export const SITE_NAME = "큐패스";

export const SITE_TAGLINE = "합격에 필요한 것만, 중요한 순서대로";

export const SITE_DESCRIPTION =
  "국가기술자격 필기시험을 준비하는 분들을 위한 무료 문제 풀이 사이트입니다. 자격증별 출제 경향을 확인하고, 한 문제씩 풀면서 바로 정답과 쉬운 해설을 볼 수 있습니다.";

/**
 * 사이트 주소. 배포 후 Vercel 환경변수 NEXT_PUBLIC_SITE_URL 에 실제 주소를 넣는다.
 * (canonical, sitemap, OG 이미지 주소가 모두 이 값을 쓴다)
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "");

export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/** 하단 고지 문구 */
export const COPYRIGHT_NOTICE =
  "기출문제의 저작권은 한국산업인력공단에 있습니다. AI 예상문제와 해설에는 오류가 있을 수 있으니, 이상한 점이 보이면 '문제 오류 신고'로 알려 주세요.";

/** 광고 자리 미리보기 (실제 광고는 아직 넣지 않음). NEXT_PUBLIC_SHOW_AD_SLOTS=1 이면 자리 표시 */
export const SHOW_AD_SLOTS = process.env.NEXT_PUBLIC_SHOW_AD_SLOTS === "1";
