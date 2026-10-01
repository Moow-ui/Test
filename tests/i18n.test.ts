import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/config/brand";
import { getCertList, getCertificationIn, getReadyCertifications } from "@/lib/data";
import {
  DEFAULT_LOCALE,
  LOCALES,
  brandName,
  fmt,
  getMessages,
  isLocale,
  localeCountry,
  localePath,
  pickLocale,
} from "@/lib/i18n";
import { certMainMeta, homeMeta, languageAlternates } from "@/lib/seo";

/** 객체의 모든 키 경로 ("a.b.c"). 배열은 길이까지 비교한다 */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

function leafStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(leafStrings);
  return [];
}

describe("messages", () => {
  it("ko.json 과 en.json 의 키 구성이 같다", () => {
    expect(keyPaths(getMessages("en")).sort()).toEqual(keyPaths(getMessages("ko")).sort());
  });

  it("같은 키의 문구는 같은 {변수}를 쓴다", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const walk = (a: unknown, b: unknown, at: string): void => {
      if (typeof a === "string" && typeof b === "string") {
        expect(vars(b), at).toBe(vars(a));
      } else if (a && b && typeof a === "object" && typeof b === "object") {
        for (const key of Object.keys(a)) {
          walk((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], `${at}.${key}`);
        }
      }
    };
    walk(getMessages("ko"), getMessages("en"), "messages");
  });

  it("영어 문구에 한글이 섞여 있지 않다", () => {
    expect(leafStrings(getMessages("en")).filter((s) => /[가-힣]/.test(s))).toEqual([]);
  });

  it("사이트 이름은 문구 파일에 직접 쓰지 않는다 (config/brand.ts 한 곳)", () => {
    for (const locale of LOCALES) {
      const names = Object.values(BRAND).map((b) => b.name);
      const found = leafStrings(getMessages(locale)).filter((s) => names.some((n) => s.includes(n)));
      expect(found).toEqual([]);
    }
  });

  it("fmt 는 {변수}를 채우고, 모르는 변수는 그대로 둔다", () => {
    expect(fmt("{n}문제 · {name}", { n: 5, name: "전기" })).toBe("5문제 · 전기");
    expect(fmt("{a} {b}", { a: 1 })).toBe("1 {b}");
  });
});

describe("화면 코드에 하드코딩된 한글 문구가 없다", () => {
  const root = process.cwd();

  function walk(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
  }

  /** 주석을 지운다 (문구가 아니므로 한글이어도 된다) */
  function stripComments(source: string): string {
    return source
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
  }

  it.each(["app", "components"])("%s", (dir) => {
    const offenders: string[] = [];
    for (const file of walk(path.join(root, dir))) {
      const lines = stripComments(fs.readFileSync(file, "utf8")).split("\n");
      lines.forEach((line, i) => {
        if (/[가-힣]/.test(line)) offenders.push(`${path.relative(root, file)}:${i + 1} ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe("언어 고르기", () => {
  it("브라우저 언어로 ko / en 을 고르고, 모르면 en", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(pickLocale("ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")).toBe("ko");
    expect(pickLocale("en-US,en;q=0.9,ko;q=0.8")).toBe("en");
    expect(pickLocale("ja-JP,ja;q=0.9")).toBe("en");
    expect(pickLocale("ja;q=0.9,ko;q=0.5")).toBe("ko");
    expect(pickLocale("en;q=0.2,ko;q=0.8")).toBe("ko");
    expect(pickLocale("*")).toBe("en");
    expect(pickLocale("")).toBe("en");
    expect(pickLocale(null)).toBe("en");
    expect(pickLocale(["ko", "en"])).toBe("ko");
    expect(pickLocale(["fr-FR"])).toBe("en");
  });

  it("주소에 언어 경로를 붙인다", () => {
    expect(localePath("ko")).toBe("/ko");
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("ko", "/cert/forklift-operator")).toBe("/ko/cert/forklift-operator");
    expect(isLocale("ko")).toBe(true);
    expect(isLocale("cert")).toBe(false);
  });

  it("브랜드명은 언어별로 다르다", () => {
    expect(brandName("ko")).toBe(BRAND.ko.name);
    expect(brandName("en")).toBe(BRAND.en.name);
    expect(homeMeta("ko").title).toContain(BRAND.ko.name);
    expect(homeMeta("en").title).toContain(BRAND.en.name);
    expect(homeMeta("en").title).not.toContain(BRAND.ko.name);
  });
});

describe("나라별 자격증", () => {
  it("/ko 에는 한국, /en 에는 미국 자격증만 나온다", async () => {
    const all = await getCertList();
    for (const locale of LOCALES) {
      const country = localeCountry(locale);
      const list = await getCertList(country);
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((c) => c.country === country)).toBe(true);
      expect((await getReadyCertifications(country)).every((c) => c.country === country)).toBe(true);
    }
    expect((await getCertList("KR")).length + (await getCertList("US")).length).toBe(all.length);
  });

  it("다른 나라 자격증 주소는 열리지 않는다", async () => {
    expect(await getCertificationIn("KR", "forklift-operator")).not.toBeNull();
    expect(await getCertificationIn("US", "forklift-operator")).toBeNull();
    expect(await getCertificationIn("KR", "epa-608")).toBeNull();
  });

  it("자격증 title 에 그 언어의 브랜드명이 들어간다", async () => {
    const kr = await getCertificationIn("KR", "forklift-operator");
    const us = await getCertificationIn("US", "epa-608");
    expect(certMainMeta("ko", kr!).title.endsWith(`| ${BRAND.ko.name}`)).toBe(true);
    expect(certMainMeta("en", us!).title.endsWith(`| ${BRAND.en.name}`)).toBe(true);
    expect(certMainMeta("ko", kr!).path).toBe("/ko/cert/forklift-operator");
  });
});

describe("hreflang", () => {
  it("두 언어에 다 있는 화면은 서로를 가리킨다", () => {
    expect(languageAlternates("ko", "/ko", "/")).toEqual({ ko: "/ko", en: "/en", "x-default": "/" });
    expect(languageAlternates("en", "/en/notes", "/notes")).toEqual({
      ko: "/ko/notes",
      en: "/en/notes",
      "x-default": "/en/notes",
    });
  });

  it("나라별 콘텐츠는 자기 자신을 가리키고, 다른 언어는 그 언어의 홈", () => {
    expect(languageAlternates("ko", "/ko/cert/forklift-operator")).toEqual({
      ko: "/ko/cert/forklift-operator",
      en: "/en",
      "x-default": "/ko/cert/forklift-operator",
    });
  });
});
