import { certMetaSchema, chaptersFileSchema, conceptsFileSchema } from "../schemas";
import type { CertText } from "../content-quality";
import { CERTS_DIR, chaptersFile, conceptsFile, countryDir, metaFile, questionsDir } from "./paths";
import type { DataStore } from "./store";

export interface CertTextEntry {
  text: CertText;
  refinedAt?: string;
  addedAt?: string;
}

/**
 * 고유 내용 검사(lib/content-quality.ts)에 넘길 자격증 글 모음. 문제가 있는 자격증만.
 * 형식이 틀린 파일은 건너뛴다 (형식 오류는 validate 의 다른 검사가 잡는다).
 */
export async function loadCertTexts(store: DataStore): Promise<CertTextEntry[]> {
  const out: CertTextEntry[] = [];
  for (const country of await store.list(CERTS_DIR)) {
    if (country !== "KR" && country !== "US") continue;
    for (const slug of await store.list(countryDir(country))) {
      const meta = certMetaSchema.safeParse(await store.readJson(metaFile(country, slug)));
      const chapters = chaptersFileSchema.safeParse(await store.readJson(chaptersFile(country, slug)));
      const hasQuestions = (await store.list(questionsDir(country, slug))).some((n) => n.endsWith(".json"));
      if (!meta.success || !chapters.success || !hasQuestions) continue;
      const conceptsRaw = await store.readJson(conceptsFile(country, slug));
      const concepts = conceptsRaw ? conceptsFileSchema.safeParse(conceptsRaw) : null;
      const conceptChapters = concepts?.success ? concepts.data.chapters : {};
      out.push({
        refinedAt: meta.data.refinedAt,
        addedAt: meta.data.addedAt,
        text: {
          id: slug,
          country,
          names: [meta.data.name, meta.data.officialName, meta.data.spacedName, ...meta.data.shortNames],
          chapters: chapters.data.subjects.flatMap((s) =>
            s.chapters.map((c) => {
              const cc = conceptChapters[c.id];
              return {
                id: c.id,
                summary: c.summary,
                keyPoints: c.keyPoints,
                pitfalls: c.pitfalls,
                conceptText: cc?.verifiedAt
                  ? [...(cc.summary ?? []), ...cc.concepts.map((k) => k.definition), ...cc.points]
                  : undefined,
              };
            }),
          ),
        },
      });
    }
  }
  return out;
}
