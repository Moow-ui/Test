import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Fold, FoldMark } from "@/components/Fold";
import { JsonLd } from "@/components/JsonLd";
import { AnalysisPanel } from "@/components/cert/AnalysisPanel";
import { CertBoxes } from "@/components/cert/CertBoxes";
import { ANALYSIS_ANCHOR } from "@/components/cert/anchors";
import { IssuerNotice } from "@/components/cert/IssuerNotice";
import { BasisBadge } from "@/components/cert/BasisBadge";
import { RelatedCerts } from "@/components/cert/RelatedCerts";
import { StudyTips } from "@/components/cert/StudyTips";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { getCertList, getCertificationIn, getConcepts, getGuidesForCert, getQuestions } from "@/lib/data";
import { pastCredit } from "@/lib/format";
import { fmt, getMessages, isLocale, localeCountry, localePath, writtenVars } from "@/lib/i18n";
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
  // 개념 정리(검증 통과 단원)가 있으면 "핵심 개념 먼저 보기"와 출제 분석의 단원 이름이 그 페이지로 간다
  const concepts = cert ? await getConcepts(cert.id) : null;
  if (!cert) notFound();
  const m = getMessages(lang);

  const meta = certMainMeta(lang, cert);
  const allCerts = await getCertList(country);
  const guides = await getGuidesForCert(lang, cert.id);
  const related = cert.relatedCertIds
    .map((id) => allCerts.find((c) => c.id === id))
    .filter((c) => c !== undefined)
    .filter((c) => c.ready); // "준비 중" 자격증은 관련 목록에서 숨긴다

  const questions = await getQuestions(cert.id);
  const scopes = ["all", ...cert.subjects.map((s) => s.id)];
  const counts = Object.fromEntries(
    LEVELS.map((level) => [
      level,
      Object.fromEntries(scopes.map((scope) => [scope, countAvailable(questions, level, scope)])),
    ]),
  ) as Record<QuizLevel, Record<string, number>>;
  const pastCount = questions.filter((q) => q.source === "past").length;
  // 수록한 기출의 출처·이용 조건 (문제의 pastInfo 에서 모은다. 같은 시험은 한 줄)
  const pastCredits = [...new Set(questions.map((q) => pastCredit(q, m, false)).filter((c): c is string => !!c))];
  const { examInfo, content } = cert;
  const pastMeta = certPastMeta(lang, cert, pastCount > 0, 0);

  return (
    <article className="space-y-6">
      {content && <JsonLd data={faqJsonLd(content.faqs)} />}
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: cert.name, path: meta.path },
        ]}
      />

      <div className="text-center">
        <h1 className="text-xl font-bold leading-snug tracking-tight sm:text-2xl">{meta.h1}</h1>
        {cert.ready && cert.examInfo && <p className="mt-1 text-sm text-ink-sub">{m.cert.h1Sub}</p>}
        <BasisBadge lang={lang} year={cert.basisYear} />
      </div>

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
        showConcepts={cert.ready && !!examInfo}
        concepts={
          concepts && concepts.chapters.length > 0
            ? {
                href: localePath(lang, `/cert/${cert.id}/concepts`),
                subjects: cert.subjects.filter((s) => s.chapters.some((c) => concepts.chapters.some((k) => k.id === c.id)))
                  .length,
                chapters: concepts.chapters.length,
              }
            : undefined
        }
      />

      {pastCredits.length > 0 && (
        <div className="space-y-1 text-sm text-ink-sub" data-past-credits="">
          <p>{fmt(m.cert.pastIncluded, { n: pastCount })}</p>
          {pastCredits.map((credit) => (
            <p key={credit}>{credit}</p>
          ))}
        </div>
      )}

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

      {/* 시험 정보는 접어 두고, 출제 분석은 펼쳐 둔다 (사용자 결정 2026-10-18). 내용은 HTML 에 그대로 있음 */}
      {/* 접는 상자들(시험 정보·출제 분석·학습 팁·수험 정보·더 알아보기)은 같은 간격으로 한 묶음 (2026-11-07 회장 결정) */}
      <div className="space-y-2 pt-4">
        {examInfo && (
          <>
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

            <Fold id={ANALYSIS_ANCHOR} title={m.cert.analysis} defaultOpen>
              <AnalysisPanel
                certId={cert.id}
                subjects={cert.subjects}
                linkChapters={cert.ready}
                conceptChapterIds={concepts?.chapters.map((c) => c.id)}
              />
            </Fold>
          </>
        )}

        {/* 운영진 학습 팁(운영진 작성). 이용자 후기와 섞지 않고 따로 둔다 */}
        {cert.studyTips && <StudyTips locale={lang} certName={cert.name} tips={cert.studyTips} />}

        {/* 이 자격증을 다룬 시험 준비 안내 글 (글이 있을 때만). 학습 팁처럼 접어 둔 상자 */}
        {guides.length > 0 && (
          <details aria-labelledby="cert-guides" className="card">
            <summary className="flex min-h-14 items-center justify-between gap-2 px-4">
              <h2 id="cert-guides" className="font-bold">
                {m.guide.certRelated}
              </h2>
              <span className="shrink-0 text-sm font-bold text-accent">
                <FoldMark />
              </span>
            </summary>
            <ul className="space-y-2 px-4 pb-4">
              {guides.map((g) => (
                <li key={g.slug}>
                  <Link href={localePath(lang, `/guide/${g.slug}`)} className="link">
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* 읽을거리(출제 경향·자격증 소개·자주 묻는 질문)도 학습 팁처럼 접어 둔 상자 (2026-11-07 회장 결정) */}
        {content && (
          <details aria-labelledby="cert-more" className="card">
            <summary className="flex min-h-14 items-center justify-between gap-2 px-4 py-2">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <h2 id="cert-more" className="font-bold">
                  {fmt(m.cert.more, { name: cert.name })}
                </h2>
                <span className="text-sm text-ink-sub">{m.cert.moreSub}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-accent">
                <FoldMark />
              </span>
            </summary>
            <div className="space-y-6 px-4 pb-4 text-sm">
              <section className="space-y-2">
                <h3 className="font-bold">{fmt(m.cert.trendTitle, { name: cert.name, ...writtenVars(lang, cert.writtenExam) })}</h3>
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
                <h3 className="font-bold">{fmt(m.cert.introTitle, { name: cert.name })}</h3>
                <p>{content.intro}</p>
              </section>
              <section>
                <h3 className="font-bold">{m.cert.faqTitle}</h3>
                <dl className="mt-2 space-y-4">
                  {content.faqs.map((faq) => (
                    <div key={faq.question}>
                      <dt className="font-bold">{fmt(m.cert.faqQ, { question: faq.question })}</dt>
                      <dd className="mt-2">{faq.answer}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <RelatedCerts locale={lang} certName={cert.name} related={related} />
            </div>
          </details>
        )}
      </div>
      {/* "준비 중" 자격증은 접어 둘 읽을거리가 없어서 관련 자격증을 그대로 보여 준다 */}
      {!content && <RelatedCerts locale={lang} certName={cert.name} related={related} />}

      <ReviewSection certId={cert.id} certName={cert.name} />

      <IssuerNotice locale={lang} cert={cert} />
    </article>
  );
}
