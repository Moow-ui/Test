import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Stars } from "@/components/Stars";
import { ConceptByline, ConceptCards, ExamSummary } from "@/components/concepts/ConceptParts";
import { IssuerNotice } from "@/components/cert/IssuerNotice";
import { getCertificationIn, getConcepts } from "@/lib/data";
import { fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { articleJsonLd, certMainMeta, certOgImagePath, conceptsMeta, toMetadata } from "@/lib/seo";
import { conceptParams } from "@/lib/static-params";

type Props = { params: Promise<{ lang: string; slug: string }> };

// 검증을 통과한 개념 정리가 있는 자격증만 빌드 때 정적 HTML 로 만든다
export const dynamicParams = false;

export const generateStaticParams = conceptParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cert = await getCertificationIn(localeCountry(lang), slug);
  const concepts = cert && (await getConcepts(cert.id));
  if (!cert || !concepts) return {};
  return toMetadata(lang, conceptsMeta(lang, cert, concepts.chapters.length), {
    ogImagePath: certOgImagePath(lang, cert.id),
  });
}

/**
 * 자격증 개념 정리: 한 줄 요약(시험 형태·과목 수·합격 기준) → 단원 목차(중요도 ★) → 단원별 핵심 개념 카드 → [5문제 풀기].
 * 본문은 서버에서 HTML 로 그린다 (로그인 없이 열람, 검색엔진 색인).
 */
export default async function ConceptsPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cert = await getCertificationIn(localeCountry(lang), slug);
  const concepts = cert && (await getConcepts(cert.id));
  if (!cert?.ready || !cert.examInfo || !concepts) notFound();
  const m = getMessages(lang);
  const meta = conceptsMeta(lang, cert, concepts.chapters.length);
  const certPath = certMainMeta(lang, cert).path;
  const byId = new Map(concepts.chapters.map((c) => [c.id, c]));

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={articleJsonLd(lang, meta, concepts.verifiedAt)} />
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: certPath },
          { name: m.concepts.breadcrumb, path: meta.path },
        ]}
      />

      <header className="space-y-4">
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{meta.h1}</h1>
        <ConceptByline locale={lang} by={concepts.by} />
        <ExamSummary locale={lang} cert={cert} />
        <Link href={`${certPath}/quiz?level=basic&count=5&subject=all`} className="btn btn-primary btn-lg w-full sm:w-auto">
          {fmt(m.concepts.solve5, { name: cert.name })}
        </Link>
      </header>

      {/* 단원 목차: 과목별, 중요도 ★ 와 과목 안 출제 비중(추정) */}
      <nav aria-labelledby="toc-title" className="card p-6">
        <h2 id="toc-title" className="text-lg font-bold">
          {m.concepts.tocTitle}
        </h2>
        <p className="mt-2 text-sm text-ink-sub">{m.concepts.tocHint}</p>
        <div className="mt-4 space-y-6">
          {cert.subjects.map((subject) => (
            <section key={subject.id}>
              <h3 className="font-bold">
                {subject.name}
                <span className="ml-2 text-sm font-normal text-ink-sub">
                  {fmt(m.concepts.subjectItems, { n: subject.questionCount })}
                </span>
              </h3>
              <ol className="mt-2 space-y-2">
                {subject.chapters.map((chapter) => (
                  <li key={chapter.id} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {byId.has(chapter.id) ? (
                      <a href={`#${chapter.id}`} className="link inline-flex min-h-11 items-center">
                        {chapter.name}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-11 items-center">
                        {chapter.name}
                        <span className="ml-2 text-sm text-ink-sub">({m.concepts.notYet})</span>
                      </span>
                    )}
                    <span className="text-sm text-ink-sub">
                      <Stars value={chapter.importance} />{" "}
                      {fmt(m.concepts.weightEstimated, { n: chapter.examWeight })}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-sub">{m.concepts.weightNote}</p>
      </nav>

      {/* 단원별 핵심 개념 카드 (정의만. 외우는 요령·포인트·비교표·대표 문제는 단원 페이지에) */}
      {cert.subjects.map((subject) =>
        subject.chapters
          .filter((chapter) => byId.has(chapter.id))
          .map((chapter) => {
            const c = byId.get(chapter.id)!;
            return (
              <section key={chapter.id} id={chapter.id} aria-labelledby={`${chapter.id}-title`} className="scroll-mt-4">
                <p className="text-sm text-ink-sub">{subject.name}</p>
                <h2 id={`${chapter.id}-title`} className="text-lg font-bold">
                  {chapter.name} <Stars value={chapter.importance} />
                </h2>
                <ConceptCards locale={lang} concepts={c.concepts} compact />
                <Link href={`${meta.path}/${chapter.id}`} className="link mt-2 inline-flex min-h-11 items-center">
                  {fmt(m.concepts.readChapter, { name: chapter.name })}
                </Link>
              </section>
            );
          }),
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`${certPath}/quiz?level=basic&count=5&subject=all`} className="btn btn-primary btn-lg">
          {fmt(m.concepts.solve5, { name: cert.name })}
        </Link>
        <Link href={certPath} className="btn btn-lg">
          {fmt(m.concepts.toCert, { cert: cert.name })}
        </Link>
      </div>

      <IssuerNotice locale={lang} cert={cert} />
    </article>
  );
}
