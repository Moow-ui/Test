/** P15: 홈 "오늘의 1문제" — 날짜마다 고정, 자격증을 돌아가며, 검수 완료 문제만 */
import { describe, expect, it } from "vitest";
import { buildDailySchedule, dailyDateKey, dailyEntryFor, dayNumber, isDailyCandidate } from "@/lib/daily";
import type { Question } from "@/lib/types";

const candidates = [
  { certId: "b-cert", certName: "B", items: [{ id: "b-1", file: "x" }, { id: "b-2", file: "x" }] },
  { certId: "a-cert", certName: "A", items: [{ id: "a-1", file: "y" }] },
  { certId: "c-cert", certName: "C", items: [] },
];

describe("오늘의 1문제", () => {
  it("일정표는 만들 때마다 같고, 자격증을 id 순으로 돌아가며 고른다 (후보 없는 자격증은 빠진다)", () => {
    const one = buildDailySchedule(candidates, 10);
    expect(buildDailySchedule(candidates, 10)).toEqual(one);
    expect(one.map((e) => e.certId)).toEqual(Array.from({ length: 10 }, (_, k) => (k % 2 === 0 ? "a-cert" : "b-cert")));
  });

  it("같은 날짜는 같은 문제, 다음 날은 다음 칸", () => {
    const schedule = buildDailySchedule(candidates, 7);
    const today = dailyEntryFor(schedule, "2026-10-04");
    expect(dailyEntryFor(schedule, "2026-10-04")).toBe(today);
    expect(dailyEntryFor(schedule, "2026-10-05")).toBe(schedule[(dayNumber("2026-10-04") + 1) % 7]);
    expect(dailyEntryFor([], "2026-10-04")).toBeNull();
  });

  it("날짜는 그 나라 시간대로 바뀐다 (한국 자정)", () => {
    expect(dailyDateKey("KR", new Date("2026-10-04T14:59:00Z"))).toBe("2026-10-04");
    expect(dailyDateKey("KR", new Date("2026-10-04T15:00:00Z"))).toBe("2026-10-05");
  });

  it("검수 완료·출제 중·그림 없는 문제만 후보", () => {
    const base = { source: "predicted", reviewStatus: "verified", reviewedAt: "2026-10-02", retired: false } as Question;
    expect(isDailyCandidate(base)).toBe(true);
    expect(isDailyCandidate({ ...base, reviewStatus: "unverified", reviewedAt: undefined })).toBe(false);
    expect(isDailyCandidate({ ...base, retired: true })).toBe(false);
    expect(isDailyCandidate({ ...base, image: "a.png" })).toBe(false);
  });
});
