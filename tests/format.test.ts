import { describe, expect, it } from "vitest";
import { circled } from "@/lib/format";
import { MAX_CHOICES } from "@/lib/schemas";

describe("circled", () => {
  it("5지선다의 5번 선지도 ⑤ 로 보여 준다", () => {
    expect(circled(1)).toBe("①");
    expect(circled(4)).toBe("④");
    expect(circled(5)).toBe("⑤");
  });

  it("선지 수 최댓값까지 모두 동그라미 번호가 있다", () => {
    for (let n = 1; n <= MAX_CHOICES; n++) expect(circled(n)).not.toBe(String(n));
  });
});
