import type { ReactNode } from "react";

const TONE = {
  primary: "stroke-primary",
  ok: "stroke-ok",
  bad: "stroke-bad",
} as const;

/**
 * 점수 원형 게이지 (움직이는 효과 없음). 0점은 빈 고리, 100점은 꽉 찬 고리.
 * marker(0~100)를 주면 그 자리에 짧은 눈금을 그린다 (합격선 표시). 가운데 글자는 children.
 * 글자 크기 설정과 상관없이 고리 크기는 px 로 고정한다.
 */
export function ScoreRing({
  score,
  size = 132,
  stroke = 12,
  tone = "primary",
  marker,
  label,
  children,
}: {
  score: number;
  size?: number;
  stroke?: number;
  tone?: keyof typeof TONE;
  marker?: number;
  /** 화면 읽기 프로그램용 설명 (예: "점수 20점") */
  label: string;
  children?: ReactNode;
}) {
  const center = size / 2;
  const r = (size - stroke) / 2 - 3;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));
  const tick =
    marker === undefined
      ? null
      : (() => {
          const angle = (Math.max(0, Math.min(100, marker)) / 100) * 2 * Math.PI;
          const inner = r - stroke / 2 - 2;
          const outer = r + stroke / 2 + 2;
          return {
            x1: center + inner * Math.cos(angle),
            y1: center + inner * Math.sin(angle),
            x2: center + outer * Math.cos(angle),
            y2: center + outer * Math.sin(angle),
          };
        })();

  return (
    <div role="img" aria-label={label} className="relative shrink-0" style={{ width: size, height: size }}>
      {/* -90도 돌려서 12시 방향부터 시계 방향으로 채운다 */}
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        {pct > 0 && (
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap={pct >= 100 ? "butt" : "round"}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct / 100)}
            className={TONE[tone]}
          />
        )}
        {tick && <line {...tick} strokeWidth={3} strokeLinecap="round" className="stroke-ink" />}
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center text-center leading-tight">
        {children}
      </div>
    </div>
  );
}
