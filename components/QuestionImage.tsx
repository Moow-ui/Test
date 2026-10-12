/**
 * 문제·개념 그림 한 장 (SVG, data: 주소).
 * 다크 모드에서도 흰 바탕(figure-bg)에 그린다: 표지판 색과 회로도의 검은 선이 그대로 보이게.
 * 문제+선지가 한 화면에 들어오도록 높이를 제한하고, 폭이 좁으면 줄어든다 (SVG 의 viewBox).
 * <img> 로만 그리므로 SVG 안에 무엇이 있어도 실행되지 않는다.
 */
export function QuestionImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="mt-2">
      <div className="flex justify-center rounded-lg border border-card-line bg-figure-bg p-2">
        {/* data: 주소의 작은 SVG 라 next/image 의 최적화가 필요 없다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-auto max-h-64 w-auto max-w-full sm:max-h-72" />
      </div>
      {caption && <figcaption className="mt-2 text-sm text-ink-sub">{caption}</figcaption>}
    </figure>
  );
}
