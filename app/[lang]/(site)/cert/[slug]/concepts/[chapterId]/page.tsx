import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Stars } from "@/components/Stars";
import { StaticQuestion } from "@/components/StaticQuestion";
import { ConceptByline, ConceptCards, ConceptCompare, ConceptFigures, ConceptPoints } from "@/components/concepts/ConceptParts";
import { IssuerNotice } from "@/components/cert/IssuerNotice";
import { BasisBadge } from "@/components/cert/BasisBadge";
import { PrintTracker } from "@/components/concepts/PrintButton";
import { ChapterPitfalls, ChapterSolve, ChapterWeight, PastTrend } from "@/components/cert/ChapterExtras";
import { chapterHref } from "@/lib/chapter-link";
import { mergeKeyPoints } from "@/lib/content-quality";
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

  // 단원 페이지를 합친 자격증(meta.mergedAt): 단원 핵심정리 내용까지 이 페이지에 모은다 (docs/refine.md 3-7)
  const merged = !!cert.mergedAt;
  const mergedIds = new Set(concepts.chapters.map((c) => c.id));
  const neighbor = (c: CertConcepts["chapters"][number] | undefined) =>
    c && { href: `${overview.path}/${c.id}`, name: chapterName(cert, c.id) };
  // 합친 자격증은 모든 단원 순서로 이동 (개념 정리가 없는 단원은 단원 핵심정리로)
  const allChapters = cert.subjects.flatMap((s) => s.chapters);
  const position = allChapters.findIndex((c) => c.id === chapter.id);
  const mergedNeighbor = (c: (typeof allChapters)[number] | undefined) =>
    c && { href: chapterHref(certPath, c.id, mergedIds), name: c.name };
  const prev = merged ? mergedNeighbor(allChapters[position - 1]) : neighbor(concepts.chapters[index - 1]);
  const next = merged ? mergedNeighbor(allChapters[position + 1]) : neighbor(concepts.chapters[index + 1]);
  const mergedExamples = merged ? pickChapterRepresentatives(cert.subjects, questions, chapter.id) : [];
  const pastInChapter = questions.filter((q) => q.chapterId === chapter.id && q.source === "past");

  // 제목 "{시험명} {단원} 개념 정리" 를 시험명 / 나머지 두 줄로 나눈다 (시험명으로 시작하지 않으면 한 줄)
  const titleLines = meta.h1.startsWith(`${cert.name} `)
    ? [cert.name, meta.h1.slice(cert.name.length + 1)]
    : [meta.h1];

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <JsonLd data={articleJsonLd(lang, meta, cert.mergedAt && cert.mergedAt > entry.verifiedAt ? cert.mergedAt : entry.verifiedAt)} />
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: certPath },
          { name: m.concepts.breadcrumb, path: overview.path },
          { name: chapter.name, path: meta.path },
        ]}
      />

      {/* 제목은 두 줄로: 위 작은 줄 = 시험 이름, 아래 큰 줄 = "{단원} 개념 정리". 가운데 맞춤 + 아래 구분선 (단원 핵심정리 페이지와 같은 모양) */}
      <header className="space-y-4 border-b border-line-soft pb-6 text-center">
        <h1 className="text-balance">
          {titleLines.length === 2 ? (
            <>
              <span className="block text-lg font-normal text-ink-sub">{titleLines[0]}</span>{" "}
              <span className="mt-1 block text-xl font-bold leading-tight sm:text-2xl">{titleLines[1]}</span>
            </>
          ) : (
            <span className="block text-xl font-bold leading-tight sm:text-2xl">{meta.h1}</span>
          )}
        </h1>
        <p className="text-sm text-ink-sub">
          {m.common.importance} <Stars value={chapter.importance} /> ·{" "}
          {fmt(m.concepts.weightEstimated, { n: chapter.examWeight })}
        </p>
        {merged && <BasisBadge lang={lang} year={cert.basisYear} />}
        <PrintTracker certId={cert.id} page="chapter" hasButton={false} />
      </header>

      {/* 개요: 요약 노트와 같은 글 (P16) */}
      {entry.summary && entry.summary.length > 0 && (
        <section aria-labelledby="overview-title" className="card space-y-2 border-l-4 border-l-primary p-6">
          <h2 id="overview-title" className="text-lg font-bold text-accent">
            {m.concepts.noteOverview}
          </h2>
          {entry.summary.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      )}

      <section aria-labelledby="concepts-title">
        <h2 id="concepts-title" className="text-lg font-bold">
          {m.concepts.coreTitle}
        </h2>
        <ConceptCards locale={lang} concepts={entry.concepts} />
      </section>

      {entry.figures && <ConceptFigures locale={lang} figures={entry.figures} />}

      {!merged && <ConceptPoints locale={lang} points={entry.points} />}

      {entry.compare && <ConceptCompare locale={lang} compare={entry.compare} />}

      {/* 합친 페이지: 핵심정리 → 자주 틀리는 함정. 함정이 있으면 시험 포인트(개념서에 그대로 있음)는 함정과 겹치므로 요점만,
          함정이 없으면 요점 + 시험 포인트(같은 말은 하나만) */}
      {merged && (
        <>
          <section aria-labelledby="keypoints-title" className="card space-y-2 border-l-4 border-l-primary p-6">
            <h2 id="keypoints-title" className="text-lg font-bold text-accent">
              {fmt(m.chapter.keyPointsTitle, { name: chapter.name })}
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {(chapter.pitfalls?.length ? chapter.keyPoints : mergeKeyPoints(chapter.keyPoints, entry.points)).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>
          <ChapterPitfalls locale={lang} chapterName={chapter.name} pitfalls={chapter.pitfalls} />
        </>
      )}

      {merged && (
        <>
          {mergedExamples.length > 0 && (
            <section aria-labelledby="examples-title" className="space-y-4">
              <h2 id="examples-title" className="text-xl font-bold">
                {fmt(m.chapter.questionsTitle, { name: chapter.name, n: mergedExamples.length })}
              </h2>
              {mergedExamples.map((q, i) => (
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
          <ChapterSolve
            locale={lang}
            certPath={certPath}
            chapterId={chapter.id}
            chapterName={chapter.name}
            subjectId={subject.id}
            subjectName={subject.name}
            quizCount={quizCount}
          />
        </>
      )}

      {!merged && examples.length > 0 && (
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

      {!merged && quizCount > 0 && (
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
        {merged && (
          <>
            <h2 className="text-lg font-bold">{fmt(m.chapter.othersTitle, { subject: subject.name })}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {subject.chapters
                .filter((c) => c.id !== chapter.id)
                .map((c) => (
                  <li key={c.id}>
                    <Link href={chapterHref(certPath, c.id, mergedIds)} className="link">
                      {c.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </>
        )}
        <p>
          <Link href={overview.path} className="btn btn-primary btn-lg w-full">
            {fmt(m.concepts.toOverview, { cert: cert.name })}
          </Link>
        </p>
      </nav>

      {/* 합친 페이지: 중요도·출제 비중(+ 공개 기출 기록)은 맨 아래 (2026-11-03 회장 요청) */}
      {merged && (
        <>
          <ChapterWeight
            locale={lang}
            importance={chapter.importance}
            subjectName={subject.name}
            subjectTotal={subject.questionCount}
            examWeight={chapter.examWeight}
          />
          {cert.refinedAt && <PastTrend locale={lang} chapterName={chapter.name} questions={pastInChapter} />}
        </>
      )}

      <IssuerNotice locale={lang} cert={cert} />

      <ConceptByline locale={lang} by={concepts.by} />
    </article>
  );
}
