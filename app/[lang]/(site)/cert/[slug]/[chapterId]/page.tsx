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
  // 핵심정리 작성 주체: 운영진 작성 / AI 작성 · 운영진 검수 / AI 작성 · 운영진 검수 전 (맨 아래 작은 안내문)
  const notesBy =
    cert.notes.by === "staff" ? m.chapter.byStaff : cert.notes.reviewedAt ? m.chapter.byAiReviewed : m.chapter.byAi;
  // 과목이 하나뿐인 시험은 과목 이름·문항 수 없이 "매회 약 N문항"
  const weightText = fmt(cert.subjects.length === 1 ? m.chapter.metaWeightSingle : m.chapter.metaWeight, {
    subject: subject.name,
    total: subject.questionCount,
    expected,
    weight: chapter.examWeight,
  });

  // 순서: 브레드크럼 → 제목 → 메타 한 줄 → 요약 → 꼭 외울 것 → 문제 풀기(CTA) → 개념 정리 링크 → 대표 문제·다른 단원 → 작성 안내
  // 주황은 별과 CTA 버튼에만 쓴다 (.muted-accent: 링크는 회색 + 밑줄). 섹션 사이 여백은 space-y-8 하나로 맞춘다
  return (
    <article className="muted-accent mx-auto max-w-3xl space-y-8">
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: certPath },
          { name: chapter.name, path: meta.path },
        ]}
      />

      <header className="space-y-2">
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{meta.h1}</h1>
        <p className="text-sm text-ink-sub">
          <Stars value={chapter.importance} /> {fmt(m.chapter.metaImportance, { n: chapter.importance })} ·{" "}
          {weightText}
        </p>
        <p className="pt-2">{chapter.summary}</p>
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

      {(quizCount > 0 || hasConcept) && (
        <div className="space-y-4">
          {quizCount > 0 && (
            <Link
              href={`${certPath}/quiz?chapter=${chapter.id}&count=${quizCount}`}
              className="btn btn-primary btn-lg w-full"
            >
              {hasPast ? m.chapter.practicePast : m.chapter.practice}
            </Link>
          )}
          {hasConcept && (
            <p className="text-center text-sm">
              <Link href={`${certPath}/concepts/${chapter.id}`} className="link inline-flex min-h-11 items-center">
                {m.chapter.moreConcepts}
              </Link>
            </p>
          )}
        </div>
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

      <p className="text-sm text-ink-sub">{notesBy}</p>
    </article>
  );
}
