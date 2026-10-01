import { describe, expect, it } from "vitest";
import { matchesQuery, searchCerts, toChosung } from "@/lib/hangul";

const certs = [
  {
    name: "전기기능사",
    officialName: "전기기능사",
    spacedName: "전기 기능사",
    shortNames: ["전기 자격증", "전기기능사 필기"],
  },
  {
    name: "지게차운전기능사",
    officialName: "지게차운전기능사",
    spacedName: "지게차 운전 기능사",
    shortNames: ["지게차 기능사", "지게차 자격증", "지게차 필기"],
  },
  {
    name: "굴착기운전기능사",
    officialName: "굴착기운전기능사",
    spacedName: "굴착기 운전 기능사",
    shortNames: ["굴삭기 자격증", "포크레인 자격증"],
  },
];

const names = (query: string) => searchCerts(certs, query).map((c) => c.name);

describe("초성 검색", () => {
  it("초성을 뽑는다", () => {
    expect(toChosung("전기기능사")).toBe("ㅈㄱㄱㄴㅅ");
    expect(toChosung("지게차운전기능사")).toBe("ㅈㄱㅊㅇㅈㄱㄴㅅ");
  });

  it("초성만 입력해도 찾는다", () => {
    expect(names("ㅈㄱㄱㄴㅅ")).toEqual(["전기기능사"]);
    expect(names("ㅈㄱㅊ")).toEqual(["지게차운전기능사"]);
  });

  it("초성과 글자를 섞어 입력해도 찾는다", () => {
    expect(names("전기ㄱㄴㅅ")).toEqual(["전기기능사"]);
  });

  it("띄어쓰기는 무시한다", () => {
    expect(names("지게차 운전 기능사")).toEqual(["지게차운전기능사"]);
    expect(names("전기 기능사")).toEqual(["전기기능사"]);
  });

  it("줄임말·다른 이름으로도 찾는다", () => {
    expect(names("지게차 필기")).toEqual(["지게차운전기능사"]);
    expect(names("포크레인")).toEqual(["굴착기운전기능사"]);
    expect(names("ㅍㅋㄹㅇ")).toEqual(["굴착기운전기능사"]);
  });

  it("이름이 검색어로 시작하는 자격증을 먼저 보여 준다", () => {
    const list = [
      { name: "기중기운전기능사", officialName: "기중기운전기능사", spacedName: "기중기 운전 기능사", shortNames: ["기중기 기능사"] },
      { name: "전기기능사", officialName: "전기기능사", spacedName: "전기 기능사", shortNames: [] },
    ];
    // "기중기 기능사"(ㄱㅈㄱㄱㄴㅅ)에도 ㅈㄱㄱㄴㅅ 이 들어 있지만, 이름이 그렇게 시작하는 전기기능사가 먼저다
    expect(searchCerts(list, "ㅈㄱㄱㄴㅅ").map((c) => c.name)).toEqual(["전기기능사", "기중기운전기능사"]);
  });

  it("빈 검색어는 전체를 돌려준다", () => {
    expect(names("")).toHaveLength(3);
    expect(names("   ")).toHaveLength(3);
  });

  it("없는 이름은 찾지 못한다", () => {
    expect(names("미용사")).toEqual([]);
    expect(matchesQuery("전기기능사", "ㅈㄱㄱㄴㅅㅅ")).toBe(false);
  });
});
