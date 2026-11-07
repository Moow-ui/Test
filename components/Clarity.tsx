import Script from "next/script";
import { CLARITY_PROJECT_ID } from "@/lib/site";

/**
 * Microsoft Clarity 태그 (화면 사용 녹화·히트맵). 프로젝트 ID 는 lib/site.ts.
 * 입력란 글자는 Clarity 가 기본으로 가린다. 회원 정보(아이디·닉네임·풀이 기록)는 따로 보내지 않는다.
 */
export function Clarity() {
  if (!CLARITY_PROJECT_ID) return null;
  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
    </Script>
  );
}
