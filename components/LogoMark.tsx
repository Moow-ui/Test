/**
 * 자격증달인 로고 마크: 주황 네모 안의 초승달(달인의 '달') + 달 안에서 위로 뻗는 체크(합격).
 * 파비콘(app/icon.svg)과 같은 모양이다. 색은 디자인 토큰(primary·on-primary)을 쓴다.
 * 글자(사이트 이름)와 함께 쓰므로 화면 읽기 프로그램에는 숨긴다.
 */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <rect width="64" height="64" rx="14" fill="var(--primary)" />
      <circle cx="29" cy="34" r="19" fill="var(--on-primary)" />
      <circle cx="37" cy="27" r="15" fill="var(--primary)" />
      <path
        d="M24 35 L31 42 L52 15"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
