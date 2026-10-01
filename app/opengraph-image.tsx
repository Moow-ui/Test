import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} - 자격증 필기 예상문제 무료 풀이`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** 사이트 기본 OG 이미지 (홈 등) */
export default function Image() {
  return renderOgImage({
    eyebrow: "무료 · 로그인 없음",
    title: "자격증 필기 문제 풀이",
    subtitle: "예상문제를 한 문제씩 풀고 바로 해설 확인",
  });
}
