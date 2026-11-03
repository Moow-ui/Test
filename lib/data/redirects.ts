import fs from "node:fs";
import path from "node:path";

/**
 * 단원 페이지 합치기의 영구 이동 목록 (next.config.ts 의 redirects 가 빌드 때 읽는다).
 * meta.json 에 mergedAt 이 있는 자격증의, 개념 정리 검증을 통과한(verifiedAt) 단원:
 *   /{lang}/cert/{slug}/{단원}  →  /{lang}/cert/{slug}/concepts/{단원}
 * next.config 는 동기 함수만 쓸 수 있어 lib/data/index.ts 와 따로 둔다 (같은 규칙: getMergedChapterIds).
 * 이동만 하고 페이지는 만들지 않으므로 배포 파일 수도 줄어든다.
 */

const COUNTRY_LOCALE: Record<string, string> = { KR: "ko", US: "en" };

export interface ChapterRedirect {
  source: string;
  destination: string;
}

function readJson(file: string): Record<string, unknown> | null {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>) : null;
}

export function mergedChapterRedirects(dataRoot = path.join(process.cwd(), "data")): ChapterRedirect[] {
  const out: ChapterRedirect[] = [];
  const certsDir = path.join(dataRoot, "certs");
  if (!fs.existsSync(certsDir)) return out;
  for (const country of fs.readdirSync(certsDir)) {
    const lang = COUNTRY_LOCALE[country];
    if (!lang) continue;
    for (const slug of fs.readdirSync(path.join(certsDir, country))) {
      const dir = path.join(certsDir, country, slug);
      const meta = readJson(path.join(dir, "meta.json"));
      if (!meta?.mergedAt) continue;
      const concepts = readJson(path.join(dir, "concepts.json")) as { chapters?: Record<string, { verifiedAt?: string }> } | null;
      for (const [chapterId, chapter] of Object.entries(concepts?.chapters ?? {})) {
        if (!chapter.verifiedAt) continue;
        out.push({
          source: `/${lang}/cert/${slug}/${chapterId}`,
          destination: `/${lang}/cert/${slug}/concepts/${chapterId}`,
        });
      }
    }
  }
  return out;
}
