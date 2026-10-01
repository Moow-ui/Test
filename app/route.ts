import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale, localePath, pickLocale } from "@/lib/i18n";

/**
 * 루트(/) 접속: 언어별 홈으로 보낸다.
 *   1. 사용자가 전에 고른 언어(쿠키)가 있으면 그 언어
 *   2. 없으면 브라우저 언어(Accept-Language)로 /ko 또는 /en
 *   3. 알 수 없으면 /en
 * 언어를 강제로 바꾸는 곳은 여기(루트)뿐이다. 다른 주소는 그대로 열리고 한 줄 안내만 보여 준다
 * (components/i18n/LocaleBanner.tsx).
 */
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(remembered) ? remembered : pickLocale(request.headers.get("accept-language"));
  return new Response(null, {
    status: 302,
    headers: {
      Location: localePath(locale),
      // 사람마다 가는 곳이 다르므로 중간 서버(CDN)가 저장해 두지 않게 한다
      "Cache-Control": "private, no-store",
      Vary: "Accept-Language, Cookie",
    },
  });
}
