import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StaticQuestion } from "@/components/StaticQuestion";
import { getCertificationIn, getQuestions } from "@/lib/data";
import { fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { pickCertRepresentatives } from "@/lib/representative";
import { certMainMeta, certOgImagePath, certPastMeta, toMetadata } from "@/lib/seo";
import { readyCertParams } from "@/lib/static-params";
import type { Certification, Question } from "@/lib/types";

type Props = { params: Promise<{ lang: string; slug: string }> };

// 문제가 준비된 자격증만 기출 페이지를 만든다
export const dynamicParams = false;

export const generateStaticParams = readyCertParams;

/** 기출이 있으면 기출만, 없으면 예상문제에서 대표 문제를 고른다 */
function selectShown(cert: Certification, questions: Question[]) {
  const past = questions.filter((q) => q.source === "past");
  const hasPast = past.length > 0;
  const shown = pickCertRepresentatives(cert.subjects, hasPast ? past : questions);
  return { past, hasPast, shown };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert) return {};
  const { hasPast, shown } = selectShown(cert, await getQuestions(cert.id));
  return toMetadata(lang, certPastMeta(lang, cert, hasPast, shown.length), {
    ogImagePath: certOgImagePath(lang, cert.id),
  });
}

export default async function PastPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert?.ready || !cert.examInfo) notFound();
  const m = getMessages(lang);

  const questions = await getQuestions(cert.id);
  const { past, hasPast, shown } = selectShown(cert, questions);
  const meta = certPastMeta(lang, cert, hasPast, shown.length);
  const mainMeta = certMainMeta(lang, cert);
  const certPath = mainMeta.path;
  const sep = m.common.listSeparator;
  const vars = {
    name: cert.name,
    spaced: cert.spacedName,
    short: cert.shortNames[0] ?? cert.name,
    shown: shown.length,
    past: past.length,
    predicted: questions.length - past.length,
    total: cert.examInfo.totalQuestions,
  };

  const chapterOf = (q: Question) => {
    const subject = cert.subjects.find((s) => s.id === q.subjectId);
    const chapter = subject?.chapters.find((c) => c.id === q.chapterId);
    return { subject, chapter };
  };

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: certPath },
          { name: hasPast ? m.past.crumbPast : m.past.crumb, path: meta.path },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">{meta.h1}</h1>
        {hasPast ? (
          <p>{fmt(m.past.introPast, { ...vars, subjects: cert.subjects.map((s) => s.name).join(sep) })}</p>
        ) : (
          <>
            <p>{fmt(m.past.intro1, vars)}</p>
            <p>
              {fmt(m.past.intro2, {
                ...vars,
                subjects: cert.subjects
                  .map((s) => fmt(m.cert.subjectItem, { name: s.name, n: s.questionCount }))
                  .join(sep),
              })}
            </p>
          </>
        )}
        <p className="rounded-lg border border-warn bg-warn-soft p-3 text-[0.95rem]">{m.past.unverifiedNote}</p>
      </header>

      <section aria-labelledby="questions-title" className="space-y-3">
        <h2 id="questions-title" className="text-xl font-extrabold">
          {fmt(hasPast ? m.past.listTitlePast : m.past.listTitle, { name: cert.name, n: shown.length })}
        </h2>
        {shown.map((q, i) => {
          const { subject, chapter } = chapterOf(q);
          return (
            <StaticQuestion
              key={q.id}
              locale={lang}
              question={q}
              number={i + 1}
              location={`${subject?.name ?? ""} › ${chapter?.name ?? ""}`}
              chapterImportance={chapter?.importance ?? 3}
            />
          );
        })}
      </section>

      <section aria-labelledby="more-title" className="rounded-xl border-2 border-primary bg-primary-soft p-4">
        <h2 id="more-title" className="text-lg font-extrabold">
          {fmt(m.past.moreTitle, { n: questions.length - shown.length })}
        </h2>
        <p className="mt-1 text-[0.95rem]">{m.past.moreHint}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link href={`${certPath}/quiz?level=intermediate&count=10&subject=all`} className="btn btn-primary btn-lg">
            {m.past.more10}
          </Link>
          <Link href={certPath} className="btn btn-lg">
            {fmt(m.past.viewAnalysis, { name: cert.name })}
          </Link>
        </div>
      </section>

      <section aria-labelledby="chapters-title">
        <h2 id="chapters-title" className="text-xl font-extrabold">
          {m.past.chaptersTitle}
        </h2>
        <div className="mt-2 space-y-3">
          {cert.subjects.map((s) => (
            <div key={s.id}>
              <h3 className="font-bold">{s.name}</h3>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {s.chapters.map((c) => (
                  <li key={c.id}>
                    <Link href={`${certPath}/${c.id}`} className="link">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

    </article>
  );
}
