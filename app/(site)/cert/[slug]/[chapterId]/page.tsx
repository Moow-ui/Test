import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Stars } from "@/components/Stars";
import { StaticQuestion } from "@/components/StaticQuestion";
import { getCertification, getQuestions, getReadyCertifications } from "@/lib/data";
import { pickChapterRepresentatives } from "@/lib/representative";
import { certMainMeta, certOgImagePath, chapterMeta, toMetadata } from "@/lib/seo";
import type { Certification } from "@/lib/types";

type Props = { params: Promise<{ slug: string; chapterId: string }> };

// 준비된 자격증의 단원만 빌드 때 정적 HTML 로 만든다
export const dynamicParams = false;

export async function generateStaticParams() {
  const certs = await getReadyCertifications();
  return certs.flatMap((cert) =>
    cert.subjects.flatMap((s) => s.chapters.map((c) => ({ slug: cert.id, chapterId: c.id }))),
  );
}

function findChapter(cert: Certification, chapterId: string) {
  for (const subject of cert.subjects) {
    const chapter = subject.chapters.find((c) => c.id === chapterId);
    if (chapter) return { subject, chapter };
  }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapterId } = await params;
  const cert = await getCertification(slug);
  const found = cert && findChapter(cert, chapterId);
  if (!cert || !found) return {};
  const questions = await getQuestions(cert.id);
  const hasPast = questions.some((q) => q.chapterId === chapterId && q.source === "past");
  return toMetadata(chapterMeta(cert, found.subject, found.chapter, hasPast), {
    ogImagePath: certOgImagePath(cert.id),
  });
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapterId } = await params;
  const cert = await getCertification(slug);
  const found = cert && findChapter(cert, chapterId);
  if (!cert?.ready || !found) notFound();

  const { subject, chapter } = found;
  const questions = await getQuestions(cert.id);
  const inChapter = questions.filter((q) => q.chapterId === chapter.id);
  const hasPast = inChapter.some((q) => q.source === "past");
  const shown = pickChapterRepresentatives(cert.subjects, questions, chapter.id);
  const meta = chapterMeta(cert, subject, chapter, hasPast);
  const mainMeta = certMainMeta(cert);
  const expected = Math.max(1, Math.round((subject.questionCount * chapter.examWeight) / 100));

  const allChapters = cert.subjects.flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })));
  const position = allChapters.findIndex((x) => x.chapter.id === chapter.id);
  const prev = allChapters[position - 1];
  const next = allChapters[position + 1];
  const quizCount = Math.min(5, inChapter.length);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        crumbs={[
          { name: "홈", path: "/" },
          { name: cert.name, path: mainMeta.path },
          { name: chapter.name, path: meta.path },
        ]}
      />

      <header className="space-y-3">
        <p className="font-bold text-ink-sub">
          {cert.name} 필기 · {subject.name} 과목
        </p>
        <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">{meta.h1}</h1>
        <dl className="card grid gap-x-4 gap-y-2 p-3 sm:grid-cols-[7rem_1fr] sm:p-4">
          <dt className="font-bold text-ink-sub">중요도</dt>
          <dd>
            <Stars value={chapter.importance} /> <span className="font-bold">({chapter.importance} / 5)</span>
          </dd>
          <dt className="font-bold text-ink-sub">출제 비중</dt>
          <dd className="font-bold">
            {subject.name} {subject.questionCount}문항 중 약 {expected}문항 ({chapter.examWeight}%)
          </dd>
        </dl>
        <p>{chapter.summary}</p>
      </header>

      {chapter.keyPoints.length > 0 && (
        <section aria-labelledby="keypoints-title">
          <h2 id="keypoints-title" className="text-xl font-extrabold">
            {chapter.name}, 이것만은 꼭 외우세요
          </h2>
          <ul className="card mt-2 list-disc space-y-2 p-4 pl-9">
            {chapter.keyPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      )}

      {shown.length > 0 && (
        <section aria-labelledby="questions-title" className="space-y-3">
          <h2 id="questions-title" className="text-xl font-extrabold">
            {chapter.name} 대표 문제 {shown.length}개
          </h2>
          {shown.map((q, i) => (
            <StaticQuestion
              key={q.id}
              question={q}
              number={i + 1}
              location={`${subject.name} › ${chapter.name}`}
              chapterImportance={chapter.importance}
            />
          ))}
        </section>
      )}

      {quizCount > 0 && (
        <section aria-label="문제 풀기" className="rounded-xl border-2 border-primary bg-primary-soft p-4">
          <p className="font-bold">읽기만 하면 금방 잊습니다. 직접 풀어서 확인해 보세요.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/cert/${cert.id}/quiz?chapter=${chapter.id}&count=${quizCount}`}
              className="btn btn-primary btn-lg"
            >
              {chapter.name} {quizCount}문제 풀기 →
            </Link>
            <Link
              href={`/cert/${cert.id}/quiz?level=basic&count=5&subject=${subject.id}`}
              className="btn btn-lg"
            >
              {subject.name} 5문제 풀기 →
            </Link>
          </div>
        </section>
      )}

      <nav aria-label="다른 단원" className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {prev ? (
            <Link href={`/cert/${cert.id}/${prev.chapter.id}`} className="btn justify-start text-left">
              ← 이전 단원: {prev.chapter.name}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/cert/${cert.id}/${next.chapter.id}`} className="btn justify-end text-right">
              다음 단원: {next.chapter.name} →
            </Link>
          )}
        </div>
        <h2 className="text-lg font-extrabold">{subject.name} 과목의 다른 단원</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {subject.chapters
            .filter((c) => c.id !== chapter.id)
            .map((c) => (
              <li key={c.id}>
                <Link href={`/cert/${cert.id}/${c.id}`} className="link">
                  {c.name}
                </Link>
              </li>
            ))}
        </ul>
        <p>
          <Link href={mainMeta.path} className="link">
            {cert.name} 전체 출제 분석으로 돌아가기 →
          </Link>
        </p>
      </nav>

      <AdSlot position="chapter-bottom" />
    </article>
  );
}
