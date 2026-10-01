import type { MetadataRoute } from "next";
import { getReadyCertifications } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

/**
 * sitemap.xml — 검색엔진에 색인시킬 페이지만 넣는다.
 * "준비 중" 자격증, 풀이 화면(/quiz, /cbt), 오답노트, 관리 페이지는 넣지 않는다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const certs = await getReadyCertifications();
  const dates = certs.map((c) => c.updatedAt).filter((d): d is string => !!d);
  const latest = dates.length > 0 ? dates.sort()[dates.length - 1] : undefined;

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "weekly", priority: 1 },
  ];

  for (const cert of certs) {
    const lastModified = cert.updatedAt ?? undefined;
    entries.push(
      {
        url: absoluteUrl(`/cert/${cert.id}`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: absoluteUrl(`/cert/${cert.id}/past`),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    );
    for (const subject of cert.subjects) {
      for (const chapter of subject.chapters) {
        entries.push({
          url: absoluteUrl(`/cert/${cert.id}/${chapter.id}`),
          lastModified,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }
  return entries;
}
