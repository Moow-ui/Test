import { describe, expect, it } from "vitest";
import { advanceInspection, kstDate, type InspectionFile } from "@/lib/inspection";

const ids = (n: number, from = 0) => Array.from({ length: n }, (_, i) => `c${String(i + from).padStart(3, "0")}`);
const nextDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

describe("검사 완료 날짜", () => {
  it("한국시간 기준 날짜", () => {
    expect(kstDate(new Date("2026-10-17T14:59:00Z"))).toBe("2026-10-17");
    expect(kstDate(new Date("2026-10-17T15:00:00Z"))).toBe("2026-10-18");
  });

  it("어제 알려 준 자격증을 어제 날짜로 적고, 오래된 것부터 10개를 고른다", () => {
    const file: InspectionFile = {
      inspected: { a: "2026-10-20", b: "2026-10-25", c: "2026-10-22" },
      today: { date: "2026-10-30", certs: ["b"] },
    };
    const step = advanceInspection(file, ["a", "b", "c", "d"], "2026-10-31", [], 2);
    expect(step.file.inspected.b).toBe("2026-10-30");
    expect(step.recorded).toEqual(["b"]);
    // d 는 기록이 없어 맨 앞, 그다음 가장 오래된 a
    expect(step.file.today).toEqual({ date: "2026-10-31", certs: ["d", "a"] });
  });

  it("같은 날 다시 실행하면 바꾸지 않는다", () => {
    const file: InspectionFile = { inspected: {}, today: { date: "2026-10-31", certs: ["a"] } };
    expect(advanceInspection(file, ["a", "b"], "2026-10-31", []).file).toBe(file);
  });

  it("검사 못 한 날의 목록은 날짜를 적지 않고 다음 날 다시 나온다", () => {
    const file: InspectionFile = { inspected: { a: "2026-10-01", b: "2026-10-02" }, today: { date: "2026-10-30", certs: ["a"] } };
    const step = advanceInspection(file, ["a", "b"], "2026-10-31", ["2026-10-30"], 1);
    expect(step.file.inspected.a).toBe("2026-10-01");
    expect(step.skippedDate).toBe("2026-10-30");
    expect(step.file.today?.certs).toEqual(["a"]);
  });

  it("없어진 자격증의 기록은 지운다", () => {
    const file: InspectionFile = { inspected: { a: "2026-10-01", gone: "2026-10-01" }, today: null };
    expect(advanceInspection(file, ["a"], "2026-10-31", []).file.inspected).toEqual({ a: "2026-10-01" });
  });

  it("매일 자격증이 늘어도 빠지는 자격증 없이 모두 차례가 온다", () => {
    let certs = ids(73);
    let file: InspectionFile = { inspected: Object.fromEntries(certs.map((id) => [id, "2026-10-30"])), today: null };
    let date = "2026-10-30";
    const lastSeen = new Map<string, number>();
    for (let day = 1; day <= 200; day++) {
      date = nextDay(date);
      certs = [...certs, ...ids(2, 73 + (day - 1) * 2)]; // 하루 2개씩 추가
      file = advanceInspection(file, certs, date, []).file;
      const todays = file.today?.certs ?? [];
      expect(todays).toHaveLength(10);
      for (const id of todays) lastSeen.set(id, day);
      // 새 자격증은 추가된 날 바로 목록에 든다
      for (const id of certs.slice(-2)) expect(todays).toContain(id);
    }
    // 마지막까지: 모든 자격증이 한 번 이상 차례가 왔고, 한 바퀴(자격증 수 ÷ 10일)보다 오래 밀린 것이 없다
    const cycle = Math.ceil(certs.length / 10);
    for (const id of certs) {
      expect(lastSeen.has(id)).toBe(true);
      expect(200 - (lastSeen.get(id) ?? 0)).toBeLessThanOrEqual(cycle);
    }
  });
});
