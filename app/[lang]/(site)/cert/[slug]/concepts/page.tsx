import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Stars } from "@/components/Stars";
import { ConceptByline, ConceptNote, ExamSummary } from "@/components/concepts/ConceptParts";
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
 * 자격증 개념 정리 = 한 자격증의 "요약 노트" (P16): 한 줄 요약(시험 형태·과목 수·합격 기준) → 단원 목차(누르면 단원 페이지)
 * → 과목별 노트(단원마다 개요 · 핵심 정리 · ★ 시험 포인트, 단원 제목을 누르면 단원 페이지) → [5문제 풀기].
 * 나중에 자격증별 요약 노트를 자료실처럼 모을 수 있게, 이 페이지 하나가 그 자격증의 노트 한 권이다.
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
        <p className="mt-2 text-sm text-ink-sub">
          {m.concepts.tocLinkHint} {m.concepts.tocHint}
        </p>
        <div className="mt-4 space-y-6">
          {cert.subjects.map((subject, si) => (
            <section key={subject.id}>
              <h3 className="font-bold">
                {fmt(m.concepts.subjectNo, { n: si + 1 })} · {subject.name}
                <span className="ml-2 text-sm font-normal text-ink-sub">
                  {fmt(m.concepts.subjectItems, { n: subject.questionCount })}
                </span>
              </h3>
              <ol className="mt-2 space-y-2">
                {subject.chapters.map((chapter, ci) => (
                  <li key={chapter.id} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {byId.has(chapter.id) ? (
                      <Link href={`${meta.path}/${chapter.id}`} className="link inline-flex min-h-11 items-center">
                        {fmt(m.concepts.chapterNo, { s: si + 1, c: ci + 1 })} {chapter.name}
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-11 items-center">
                        {fmt(m.concepts.chapterNo, { s: si + 1, c: ci + 1 })} {chapter.name}
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

      {/* 요약 노트: 과목마다 한 묶음, 그 안에 단원 노트(개요 · 핵심 정리 · ★ 시험 포인트) */}
      <section aria-labelledby="note-title" className="space-y-6">
        <h2 id="note-title" className="text-xl font-bold">
          {m.concepts.noteTitle}
        </h2>
        {cert.subjects.map((subject, si) => {
          const chapters = subject.chapters
            .map((chapter, ci) => ({ chapter, no: fmt(m.concepts.chapterNo, { s: si + 1, c: ci + 1 }) }))
            .filter(({ chapter }) => byId.has(chapter.id));
          if (chapters.length === 0) return null;
          return (
            <section key={subject.id} aria-labelledby={`${subject.id}-note`} className="card overflow-hidden">
              <h3 id={`${subject.id}-note`} className="bg-primary-soft px-4 py-4 text-lg font-bold sm:px-6">
                {fmt(m.concepts.subjectNo, { n: si + 1 })} · {subject.name}
                <span className="ml-2 text-sm font-normal text-ink-sub">
                  {fmt(m.concepts.subjectItems, { n: subject.questionCount })}
                </span>
              </h3>
              {chapters.map(({ chapter, no }) => (
                <ConceptNote
                  key={chapter.id}
                  locale={lang}
                  id={chapter.id}
                  number={no}
                  name={chapter.name}
                  href={`${meta.path}/${chapter.id}`}
                  importance={chapter.importance}
                  weight={chapter.examWeight}
                  entry={byId.get(chapter.id)!}
                />
              ))}
            </section>
          );
        })}
      </section>

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
