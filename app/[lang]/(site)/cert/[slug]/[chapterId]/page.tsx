import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Stars } from "@/components/Stars";
import { StaticQuestion } from "@/components/StaticQuestion";
import { IssuerNotice } from "@/components/cert/IssuerNotice";
import { ANALYSIS_ANCHOR } from "@/components/cert/anchors";
import { getCertificationIn, getConcepts, getQuestions } from "@/lib/data";
import { fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { pickChapterRepresentatives } from "@/lib/representative";
import { certMainMeta, certOgImagePath, chapterMeta, toMetadata } from "@/lib/seo";
import { chapterParams } from "@/lib/static-params";
import type { Certification } from "@/lib/types";

type Props = { params: Promise<{ lang: string; slug: string; chapterId: string }> };

// 준비된 자격증의 단원만 빌드 때 정적 HTML 로 만든다
export const dynamicParams = false;

export const generateStaticParams = chapterParams;

function findChapter(cert: Certification, chapterId: string) {
  for (const subject of cert.subjects) {
    const chapter = subject.chapters.find((c) => c.id === chapterId);
    if (chapter) return { subject, chapter };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug, chapterId } = await params;
  if (!isLocale(lang)) return {};
  const cert = await getCertificationIn(localeCountry(lang), slug);
  const found = cert && findChapter(cert, chapterId);
  if (!cert || !found) return {};
  const questions = await getQuestions(cert.id);
  const hasPast = questions.some((q) => q.chapterId === chapterId && q.source === "past");
  return toMetadata(lang, chapterMeta(lang, cert, found.subject, found.chapter, hasPast), {
    ogImagePath: certOgImagePath(lang, cert.id),
  });
}

export default async function ChapterPage({ params }: Props) {
  const { lang, slug, chapterId } = await params;
  if (!isLocale(lang)) notFound();
  const cert = await getCertificationIn(localeCountry(lang), slug);
  const found = cert && findChapter(cert, chapterId);
  if (!cert?.ready || !found) notFound();
  const m = getMessages(lang);

  const { subject, chapter } = found;
  const questions = await getQuestions(cert.id);
  const inChapter = questions.filter((q) => q.chapterId === chapter.id);
  const hasPast = inChapter.some((q) => q.source === "past");
  const shown = pickChapterRepresentatives(cert.subjects, questions, chapter.id);
  const meta = chapterMeta(lang, cert, subject, chapter, hasPast);
  const mainMeta = certMainMeta(lang, cert);
  const expected = Math.max(1, Math.round((subject.questionCount * chapter.examWeight) / 100));

  const allChapters = cert.subjects.flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })));
  const position = allChapters.findIndex((x) => x.chapter.id === chapter.id);
  const prev = allChapters[position - 1];
  const next = allChapters[position + 1];
  const quizCount = Math.min(5, inChapter.length);
  const certPath = mainMeta.path;
  // 이 단원의 개념 정리(검증 통과)가 있으면 그 페이지로 가는 링크를 둔다
  const hasConcept = !!(await getConcepts(cert.id))?.chapters.some((c) => c.id === chapter.id);
  // 핵심정리 작성 주체: 운영진 작성 / AI 작성 · 운영진 검수 / AI 작성 · 운영진 검수 전
  const notesBy =
    cert.notes.by === "staff" ? m.chapter.byStaff : cert.notes.reviewedAt ? m.chapter.byAiReviewed : m.chapter.byAi;

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: certPath },
          { name: chapter.name, path: meta.path },
        ]}
      />

      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-ink-sub">{fmt(m.chapter.eyebrow, { cert: cert.name, subject: subject.name })}</p>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-sm font-bold text-ink-sub">{notesBy}</span>
        </div>
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{meta.h1}</h1>
        <dl className="card grid gap-x-4 gap-y-2 p-4 sm:grid-cols-[7rem_1fr] sm:p-4">
          <dt className="font-bold text-ink-sub">{m.common.importance}</dt>
          <dd>
            <Stars value={chapter.importance} />{" "}
            <span className="font-bold">{fmt(m.chapter.importanceValue, { n: chapter.importance })}</span>
          </dd>
          <dt className="font-bold text-ink-sub">{m.chapter.weight}</dt>
          <dd className="font-bold">
            {fmt(m.chapter.weightValue, {
              subject: subject.name,
              total: subject.questionCount,
              expected,
              weight: chapter.examWeight,
            })}
          </dd>
        </dl>
        <p>{chapter.summary}</p>
        {hasConcept && (
          <Link href={`${certPath}/concepts/${chapter.id}`} className="link inline-flex min-h-11 items-center">
            {fmt(m.concepts.seeChapter, { name: chapter.name })}
          </Link>
        )}
      </header>

      {chapter.keyPoints.length > 0 && (
        <section aria-labelledby="keypoints-title">
          <h2 id="keypoints-title" className="text-xl font-bold">
            {fmt(m.chapter.keyPointsTitle, { name: chapter.name })}
          </h2>
          <ul className="card mt-2 list-disc space-y-2 p-4 pl-8">
            {chapter.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {shown.length > 0 && (
        <section aria-labelledby="questions-title" className="space-y-4">
          <h2 id="questions-title" className="text-xl font-bold">
            {fmt(m.chapter.questionsTitle, { name: chapter.name, n: shown.length })}
          </h2>
          {shown.map((q, i) => (
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
        <section aria-label={m.chapter.solveLabel} className="rounded-2xl bg-primary-soft p-4">
          <p className="font-bold">{m.chapter.solveHint}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href={`${certPath}/quiz?chapter=${chapter.id}&count=${quizCount}`} className="btn btn-primary btn-lg">
              {fmt(m.chapter.solveN, { name: chapter.name, n: quizCount })}
            </Link>
            <Link href={`${certPath}/quiz?level=basic&count=5&subject=${subject.id}`} className="btn btn-lg">
              {fmt(m.chapter.solveN, { name: subject.name, n: 5 })}
            </Link>
          </div>
        </section>
      )}

      <nav aria-label={m.chapter.otherLabel} className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {prev ? (
            <Link href={`${certPath}/${prev.chapter.id}`} className="btn justify-start text-left">
              {fmt(m.chapter.prev, { name: prev.chapter.name })}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`${certPath}/${next.chapter.id}`} className="btn justify-end text-right">
              {fmt(m.chapter.next, { name: next.chapter.name })}
            </Link>
          )}
        </div>
        <h2 className="text-lg font-bold">{fmt(m.chapter.othersTitle, { subject: subject.name })}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {subject.chapters
            .filter((c) => c.id !== chapter.id)
            .map((c) => (
              <li key={c.id}>
                <Link href={`${certPath}/${c.id}`} className="link">
                  {c.name}
                </Link>
              </li>
            ))}
        </ul>
        <p>
          <Link href={`${certPath}#${ANALYSIS_ANCHOR}`} className="link">
            {fmt(m.chapter.back, { cert: cert.name })}
          </Link>
        </p>
      </nav>

      <IssuerNotice locale={lang} cert={cert} />
    </article>
  );
}
