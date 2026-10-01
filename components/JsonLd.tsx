/** 구조화 데이터(JSON-LD) 출력. '<' 는 유니코드로 바꿔 스크립트 주입을 막는다 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
