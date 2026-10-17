import { describe, expect, it } from "vitest";
import { inspectedDate, kstDate } from "@/lib/inspection";

describe("검사 완료 날짜", () => {
  it("한국시간 기준 날짜", () => {
    expect(kstDate(new Date("2026-10-17T14:59:00Z"))).toBe("2026-10-17");
    expect(kstDate(new Date("2026-10-17T15:00:00Z"))).toBe("2026-10-18");
  });
  it("빌드한 날을 쓰고, 검사 못 한 날은 건너뛴다", () => {
    expect(inspectedDate("2026-10-18", [])).toBe("2026-10-18");
    expect(inspectedDate("2026-10-20", ["2026-10-20", "2026-10-19"])).toBe("2026-10-18");
    expect(inspectedDate("2026-11-01", ["2026-11-01"])).toBe("2026-10-31");
    expect(inspectedDate("", [])).toBeNull();
  });
});
