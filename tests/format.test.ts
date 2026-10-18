import { describe, expect, it } from "vitest";
import { circled, roundedCount } from "@/lib/format";
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

describe("roundedCount", () => {
  it("100 이상은 50 단위로 내림", () => {
    expect(roundedCount(100, "ko")).toBe("100+");
    expect(roundedCount(115, "ko")).toBe("100+");
    expect(roundedCount(243, "ko")).toBe("200+");
    expect(roundedCount(150, "en")).toBe("150+");
  });
  it("10~99 는 10 단위, 10 미만은 그대로", () => {
    expect(roundedCount(96, "ko")).toBe("90+");
    expect(roundedCount(64, "ko")).toBe("60+");
    expect(roundedCount(40, "ko")).toBe("40+");
    expect(roundedCount(37, "ko")).toBe("30+");
    expect(roundedCount(7, "ko")).toBe("7");
  });
  it("총 문제 수는 100 단위", () => {
    expect(roundedCount(3769, "ko", 100)).toBe("3,700+");
    expect(roundedCount(2221, "en", 100)).toBe("2,200+");
    expect(roundedCount(80, "ko", 100)).toBe("80+");
  });
});
