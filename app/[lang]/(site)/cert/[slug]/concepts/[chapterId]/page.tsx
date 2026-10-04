import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Stars } from "@/components/Stars";
import { StaticQuestion } from "@/components/StaticQuestion";
import { ConceptByline, ConceptCards, ConceptCompare, ConceptPoints } from "@/components/concepts/ConceptParts";
import { IssuerNotice } from "@/components/cert/IssuerNotice";
import { getCertificationIn, getConcepts, getQuestions, type CertConcepts } from "@/lib/data";
import { fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { pickChapterRepresentatives } from "@/lib/representative";
import { articleJsonLd, certMainMeta, certOgImagePath, conceptChapterMeta, conceptsMeta, toMetadata } from "@/lib/seo";
import { conceptChapterParams } from "@/lib/static-params";
import type { Certification } from "@/lib/types";

type Props = { params: Promise<{ lang: string; slug: string; chapterId: string }> };

/** 대표 문제 수 (검수를 마친 예상문제만) */
const EXAMPLE_COUNT = 3;

// 검증을 통과한 단원만 빌드 때 정적 HTML 로 만든다 (실패한 단원은 페이지가 없다)
export const dynamicParams = false;

export const generateStaticParams = conceptChapterParams;

async function load(lang: string, slug: string, chapterId: string) {
  if (!isLocale(lang)) return null;
  const cert = await getCertificationIn(localeCountry(lang), slug);
  const concepts = cert && (await getConcepts(cert.id));
  if (!cert?.ready || !concepts) return null;
  const index = concepts.chapters.findIndex((c) => c.id === chapterId);
  if (index < 0) return null;
  const subject = cert.subjects.find((s) => s.chapters.some((c) => c.id === chapterId))!;
  const chapter = subject.chapters.find((c) => c.id === chapterId)!;
  return { lang, cert, concepts, index, subject, chapter, entry: concepts.chapters[index] };
}

function chapterName(cert: Certification, id: string): string {
  for (const s of cert.subjects) for (const c of s.chapters) if (c.id === id) return c.name;
  return id;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug, chapterId } = await params;
  const found = await load(lang, slug, chapterId);
  if (!found) return {};
  const { cert, subject, chapter, entry } = found;
  return toMetadata(
    found.lang,
    conceptChapterMeta(found.lang, cert, subject, chapter, entry.concepts.length, entry.concepts[0].definition),
    { ogImagePath: certOgImagePath(found.lang, cert.id) },
  );
}

/**
 * 단원 개념 정리: 핵심 개념(정의 + 외우는 요령) → 자주 나오는 포인트 → 헷갈리는 것 비교표(있을 때만)
 * → 검수 완료 대표 문제 3개 → [이 단원 5문제 풀기] → 이전·다음 단원.
 */
export default async function ConceptChapterPage({ params }: Props) {
  const { lang: rawLang, slug, chapterId } = await params;
  const found = await load(rawLang, slug, chapterId);
  if (!found) notFound();
  const { lang, cert, concepts, index, subject, chapter, entry } = found;
  const m = getMessages(lang);

  const meta = conceptChapterMeta(lang, cert, subject, chapter, entry.concepts.length, entry.concepts[0].definition);
  const overview = conceptsMeta(lang, cert, concepts.chapters.length);
  const certPath = certMainMeta(lang, cert).path;

  const questions = await getQuestions(cert.id);
  const verified = questions.filter((q) => q.source === "predicted" && q.reviewStatus === "verified");
  const examples = pickChapterRepresentatives(cert.subjects, verified, chapter.id).slice(0, EXAMPLE_COUNT);
  const quizCount = Math.min(5, questions.filter((q) => q.chapterId === chapter.id).length);

  const neighbor = (c: CertConcepts["chapters"][number] | undefined) =>
    c && { href: `${overview.path}/${c.id}`, name: chapterName(cert, c.id) };
  const prev = neighbor(concepts.chapters[index - 1]);
  const next = neighbor(concepts.chapters[index + 1]);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={articleJsonLd(lang, meta, entry.verifiedAt)} />
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: certPath },
          { name: m.concepts.breadcrumb, path: overview.path },
          { name: chapter.name, path: meta.path },
        ]}
      />

      <header className="space-y-4">
        <p className="text-sm text-ink-sub">{fmt(m.concepts.eyebrowChapter, { cert: cert.name, subject: subject.name })}</p>
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{meta.h1}</h1>
        <p className="text-sm text-ink-sub">
          {m.common.importance} <Stars value={chapter.importance} /> ·{" "}
          {fmt(m.concepts.weightEstimated, { n: chapter.examWeight })}
        </p>
        <ConceptByline locale={lang} by={concepts.by} />
      </header>

      <section aria-labelledby="concepts-title">
        <h2 id="concepts-title" className="text-lg font-bold">
          {m.concepts.coreTitle}
        </h2>
        <ConceptCards locale={lang} concepts={entry.concepts} />
      </section>

      <ConceptPoints locale={lang} points={entry.points} />

      {entry.compare && <ConceptCompare locale={lang} compare={entry.compare} />}

      {examples.length > 0 && (
        <section aria-labelledby="examples-title" className="space-y-4">
          <h2 id="examples-title" className="text-lg font-bold">
            {fmt(m.concepts.examples, { n: examples.length })}
          </h2>
          <p className="text-sm text-ink-sub">{m.concepts.examplesHint}</p>
          {examples.map((q, i) => (
            <StaticQuestion
              key={q.id}
              locale={lang}
              question={q}
              number={i + 1}
              location={`${subject.name} › ${chapter.name}`}
              chapterImportance={chapter.importance}
            />
          ))}
        </section>
      )}

      {quizCount > 0 && (
        <Link href={`${certPath}/quiz?chapter=${chapter.id}&count=${quizCount}`} className="btn btn-primary btn-lg w-full">
          {fmt(m.concepts.solveChapter, { n: quizCount })}
        </Link>
      )}

      <nav aria-label={m.concepts.otherLabel} className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {prev ? (
            <Link href={prev.href} className="btn justify-start text-left">
              {fmt(m.concepts.prev, { name: prev.name })}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={next.href} className="btn justify-end text-right">
              {fmt(m.concepts.next, { name: next.name })}
            </Link>
          )}
        </div>
        <p>
          <Link href={overview.path} className="link inline-flex min-h-11 items-center">
            {fmt(m.concepts.toOverview, { cert: cert.name })}
          </Link>
        </p>
      </nav>

      <IssuerNotice locale={lang} cert={cert} />
    </article>
  );
}
