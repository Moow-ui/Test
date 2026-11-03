import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { chapterHref } from "@/lib/chapter-link";
import { mergeKeyPoints } from "@/lib/content-quality";
import { mergedChapterRedirects } from "@/lib/data/redirects";

describe("단원 페이지 합치기", () => {
  it("합친 단원은 개념 정리 단원 페이지로 링크한다", () => {
    const merged = new Set(["a"]);
    expect(chapterHref("/ko/cert/x", "a", merged)).toBe("/ko/cert/x/concepts/a");
    expect(chapterHref("/ko/cert/x", "b", merged)).toBe("/ko/cert/x/b");
  });

  it("핵심정리 목록은 같은 말을 한 번만 싣는다", () => {
    expect(
      mergeKeyPoints(["포크 간격은 팰릿 폭의 1/2 이상 3/4 이하로 벌립니다."], [
        "포크 간격은 팰릿 폭의 1/2 이상 3/4 이하로 벌립니다",
        "주행할 때 포크는 지면에서 20~30cm 높이로 듭니다.",
      ]),
    ).toEqual(["포크 간격은 팰릿 폭의 1/2 이상 3/4 이하로 벌립니다.", "주행할 때 포크는 지면에서 20~30cm 높이로 듭니다."]);
  });

  it("mergedAt 이 있는 자격증의 검증 통과 단원만 영구 이동한다", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "merge-"));
    const write = (rel: string, data: unknown) => {
      fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
      fs.writeFileSync(path.join(root, rel), JSON.stringify(data));
    };
    write("certs/KR/a/meta.json", { mergedAt: "2026-11-03" });
    write("certs/KR/a/concepts.json", { chapters: { c1: { verifiedAt: "2026-10-01" }, c2: {} } });
    write("certs/US/b/meta.json", {});
    write("certs/US/b/concepts.json", { chapters: { d1: { verifiedAt: "2026-10-01" } } });
    expect(mergedChapterRedirects(root)).toEqual([{ source: "/ko/cert/a/c1", destination: "/ko/cert/a/concepts/c1" }]);
  });
});
