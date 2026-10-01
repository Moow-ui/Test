/** 중요도 ★ 표시 (1~5). 색만으로 전달하지 않도록 읽어 주는 글자를 함께 둔다 */
export function Stars({ value, label = "중요도" }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      role="img"
      aria-label={`${label} 5점 중 ${v}점`}
      className="whitespace-nowrap font-bold tracking-tight text-star"
    >
      {"★".repeat(v)}
      {"☆".repeat(5 - v)}
    </span>
  );
}
