import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/site";

/**
 * Google 애널리틱스(GA4) 태그. 측정 ID 는 lib/site.ts.
 * 화면 이동(주소 변경)은 GA4 의 "향상된 측정"이 알아서 페이지뷰로 센다.
 * 회원 정보(아이디·닉네임·풀이 기록)는 보내지 않는다.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
