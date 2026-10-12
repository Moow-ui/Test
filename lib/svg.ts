/**
 * 문제·개념 그림(SVG) 규칙. (docs/data-rules.md 8장)
 *
 * 그림은 assets/ 의 SVG 파일로 두고, 화면에는 data: 주소로 문제 파일·페이지 안에 넣어 보낸다.
 * 따로 배포하지 않으므로 Cloudflare 배포 파일 수가 늘지 않는다.
 * 화면은 <img> 로만 그린다 (SVG 안의 스크립트가 실행되지 않는다). 그래도 검사에서 위험한 내용을 막는다.
 */

/** 그림 한 장의 최대 크기. 선 그림(회로도·표지판)은 보통 2~10KB 다 */
export const MAX_SVG_BYTES = 40 * 1024;

/** SVG 글을 <img src> 에 넣을 data: 주소로 바꾼다 */
export function svgDataUri(svg: string): string {
  // 줄바꿈·연속 공백을 줄이고, 주소에 쓸 수 없는 글자만 바꾼다 (base64 보다 작다)
  const compact = svg.replace(/\s+/g, " ").trim();
  const encoded = compact
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/"/g, "'")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
  return `data:image/svg+xml,${encoded}`;
}

/** SVG 그림 검사. 문제가 없으면 빈 배열 */
export function checkSvg(svg: string): string[] {
  const errors: string[] = [];
  const bytes = new TextEncoder().encode(svg).length;
  if (bytes > MAX_SVG_BYTES) errors.push(`그림이 너무 큽니다 (${Math.round(bytes / 1024)}KB, 최대 ${MAX_SVG_BYTES / 1024}KB)`);
  if (!/<svg[\s>]/i.test(svg)) errors.push("SVG 파일이 아닙니다 (<svg> 가 없습니다)");
  if (!/<svg[^>]*\sviewBox=/i.test(svg)) errors.push("<svg> 에 viewBox 가 있어야 합니다 (화면 폭에 맞춰 줄어들게)");
  if (/<script/i.test(svg)) errors.push("<script> 를 넣을 수 없습니다");
  if (/<foreignObject/i.test(svg)) errors.push("<foreignObject> 를 넣을 수 없습니다");
  if (/\son[a-z]+\s*=/i.test(svg)) errors.push("onclick 같은 이벤트 속성을 넣을 수 없습니다");
  if (/(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:)/i.test(svg)) {
    errors.push("외부 주소·다른 파일을 불러올 수 없습니다 (그림은 SVG 안에 모두 그립니다)");
  }
  if (/<image[\s>]/i.test(svg)) errors.push("<image> 로 사진을 넣을 수 없습니다 (선·도형·글자로 그립니다)");
  if (/@import|url\(\s*["']?(?:https?:|\/\/)/i.test(svg)) errors.push("외부 글꼴·스타일을 불러올 수 없습니다");
  return errors;
}
