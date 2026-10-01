import { SHOW_AD_SLOTS } from "@/lib/site";

/**
 * 광고 자리 (지금은 미구현).
 *
 * 나중에 애드센스를 넣을 위치만 잡아 둔 부품이다.
 * 평소에는 아무것도 그리지 않고, NEXT_PUBLIC_SHOW_AD_SLOTS=1 이면 자리를 점선 상자로 보여 준다.
 *
 * 배치 원칙: 선지 버튼·"다음 문제" 버튼과 붙여 놓지 않는다 (잘못 누르기 방지).
 * 그래서 위쪽 여백(mt-16)을 크게 두고, 항상 본문·버튼 묶음이 끝난 뒤에만 놓는다.
 */
export function AdSlot({ position }: { position: string }) {
  if (!SHOW_AD_SLOTS) return null;
  return (
    <aside
      aria-label="광고 영역"
      data-ad-position={position}
      className="no-print mx-auto mt-16 flex min-h-[100px] w-full max-w-3xl items-center justify-center rounded-lg border-2 border-dashed border-line text-[0.85rem] text-ink-sub"
    >
      광고 자리 ({position})
    </aside>
  );
}
