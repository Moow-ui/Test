import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Fold } from "@/components/Fold";
import { JsonLd } from "@/components/JsonLd";
import { AnalysisPanel } from "@/components/cert/AnalysisPanel";
import { CertBoxes } from "@/components/cert/CertBoxes";
import { IssuerNotice } from "@/components/cert/IssuerNotice";
import { RelatedCerts } from "@/components/cert/RelatedCerts";
import { getCertList, getCertificationIn, getQuestions } from "@/lib/data";
import { fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { levelChoiceCount } from "@/lib/choices";
import { countAvailable, mockExamShortage } from "@/lib/quiz-engine";
import { certMainMeta, certOgImagePath, certPastMeta, faqJsonLd, toMetadata } from "@/lib/seo";
import { certParams } from "@/lib/static-params";
import type { QuizLevel } from "@/lib/types";

type Props = { params: Promise<{ lang: string; slug: string }> };

// 그 나라 목록에 있는 자격증만 빌드 때 정적 HTML 로 만든다 (그 밖의 주소는 404)
export const dynamicParams = false;

export const generateStaticParams = certParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert) return {};
  // 문제가 없는 "준비 중" 페이지는 검색엔진에 색인시키지 않는다
  return toMetadata(lang, certMainMeta(lang, cert), {
    noindex: !cert.ready,
    ogImagePath: certOgImagePath(lang, cert.id),
  });
}

const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

export default async function CertPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const country = localeCountry(lang);
  const cert = await getCertificationIn(country, slug);
  if (!cert) notFound();
  const m = getMessages(lang);

  const meta = certMainMeta(lang, cert);
  const allCerts = await getCertList(country);
  const related = cert.relatedCertIds
    .map((id) => allCerts.find((c) => c.id === id))
    .filter((c) => c !== undefined);

  const questions = await getQuestions(cert.id);
  const scopes = ["all", ...cert.subjects.map((s) => s.id)];
  const counts = Object.fromEntries(
    LEVELS.map((level) => [
      level,
      Object.fromEntries(scopes.map((scope) => [scope, countAvailable(questions, level, scope)])),
    ]),
  ) as Record<QuizLevel, Record<string, number>>;
  const pastCount = questions.filter((q) => q.source === "past").length;
  const { examInfo, content } = cert;
  const pastMeta = certPastMeta(lang, cert, pastCount > 0, 0);

  return (
    <article className="space-y-5">
      {content && <JsonLd data={faqJsonLd(content.faqs)} />}
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: meta.path },
        ]}
      />

      <h1 className="text-center text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">{meta.h1}</h1>

      {/* 가장 먼저 보이는 큰 박스: 초급 / 중급 / 고급, 그 아래 실전 문제풀이 */}
      <CertBoxes
        certId={cert.id}
        ready={cert.ready}
        subjects={cert.subjects.map((s) => ({ id: s.id, name: s.name }))}
        counts={counts}
        choiceCounts={
          Object.fromEntries(
            LEVELS.map((level) => [level, levelChoiceCount(level, examInfo?.choiceCount ?? 4)]),
          ) as Record<QuizLevel, number>
        }
        cbt={
          // 실전 문제풀이 는 실제 시험과 같은 문항 수로만 낸다. 과목별 문제가 모자라면 "문제 준비 중"
          cert.ready && examInfo && mockExamShortage(cert.subjects, questions).length === 0
            ? {
                questionCount: examInfo.totalQuestions,
                minutes: examInfo.timeLimitMinutes,
                choiceCount: examInfo.choiceCount,
              }
            : null
        }
      />

      {!cert.ready && (
        <p className="card p-4">
          {fmt(m.cert.soon, { name: cert.name })}
          {allCerts
            .filter((c) => c.ready)
            .map((c) => (
              <Link key={c.id} href={localePath(lang, `/cert/${c.id}`)} className="link ml-2">
                {fmt(m.cert.goSolve, { name: c.name })}
              </Link>
            ))}
        </p>
      )}

      {/* 시험 정보·출제 분석은 아래에 접어 둔다 (내용은 HTML 에 그대로 있음) */}
      {examInfo && (
        <div className="space-y-2 pt-3">
          <Fold title={m.cert.examInfo}>
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[6rem_1fr]">
              <dt className="font-bold text-ink-sub">{m.cert.certType}</dt>
              <dd>
                {cert.grade
                  ? fmt(m.cert.certTypeWithGrade, { type: m.certTypes[cert.certType], grade: cert.grade })
                  : m.certTypes[cert.certType]}
              </dd>
              <dt className="font-bold text-ink-sub">{m.cert.field}</dt>
              <dd>{cert.field}</dd>
              <dt className="font-bold text-ink-sub">{m.cert.organizer}</dt>
              <dd>{cert.issuer.name}</dd>
              <dt className="font-bold text-ink-sub">{m.cert.subjects}</dt>
              <dd>
                {cert.subjects
                  .map((s) => fmt(m.cert.subjectItem, { name: s.name, n: s.questionCount }))
                  .join(m.cert.subjectSeparator)}
              </dd>
              <dt className="font-bold text-ink-sub">{m.cert.itemsTime}</dt>
              <dd>{fmt(m.cert.itemsTimeValue, { n: examInfo.totalQuestions, min: examInfo.timeLimitMinutes })}</dd>
              <dt className="font-bold text-ink-sub">{m.cert.format}</dt>
              <dd>{examInfo.format}</dd>
              <dt className="font-bold text-ink-sub">{m.cert.passCriteria}</dt>
              <dd className="font-bold">{examInfo.passCriteria.description}</dd>
              {content && (
                <>
                  <dt className="font-bold text-ink-sub">{m.cert.eligibility}</dt>
                  <dd>{content.eligibility}</dd>
                </>
              )}
            </dl>
          </Fold>

          <Fold title={m.cert.analysis}>
            <AnalysisPanel certId={cert.id} subjects={cert.subjects} linkChapters={cert.ready} />
          </Fold>
        </div>
      )}

      <RelatedCerts locale={lang} certName={cert.name} related={related} />

      {/* 읽을거리(출제 경향·자격증 소개·자주 묻는 질문)는 맨 아래에 작게 접어 둔다 */}
      {content && (
        <details className="pt-6 text-[0.85rem]">
          <summary className="inline-flex min-h-10 items-center font-bold text-ink-sub underline underline-offset-2">
            <span className="when-closed">{fmt(m.cert.more, { name: cert.name })}</span>
            <span className="when-open">{m.common.hide}</span>
          </summary>
          <div className="mt-2 space-y-5">
            <section className="space-y-2">
              <h2 className="font-extrabold">{fmt(m.cert.trendTitle, { name: cert.name })}</h2>
              <p>{content.trendSummary}</p>
              <p>{content.studyTip}</p>
              {cert.ready && (
                <p>
                  <Link href={pastMeta.path} className="link">
                    {fmt(m.cert.viewPast, { title: pastMeta.h1 })}
                  </Link>
                </p>
              )}
            </section>
            <section className="space-y-2">
              <h2 className="font-extrabold">{fmt(m.cert.introTitle, { name: cert.name })}</h2>
              <p>{content.intro}</p>
            </section>
            <section>
              <h2 className="font-extrabold">{m.cert.faqTitle}</h2>
              <dl className="mt-2 space-y-3">
                {content.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="font-bold">{fmt(m.cert.faqQ, { question: faq.question })}</dt>
                    <dd className="mt-1">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </details>
      )}

      <IssuerNotice locale={lang} cert={cert} />
    </article>
  );
}
