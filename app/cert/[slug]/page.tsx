import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Badge } from "@/components/Badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { AnalysisPanel } from "@/components/cert/AnalysisPanel";
import { CertQuickActions } from "@/components/cert/CertQuickActions";
import { CertTabs } from "@/components/cert/CertTabs";
import { RelatedCerts } from "@/components/cert/RelatedCerts";
import { StartPanel } from "@/components/cert/StartPanel";
import { getCertList, getCertification, getQuestions } from "@/lib/data";
import { countAvailable, mockExamSeconds } from "@/lib/quiz-engine";
import { certMainMeta, certPastMeta, faqJsonLd, toMetadata } from "@/lib/seo";
import type { QuizLevel } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

// 목록에 있는 자격증만 빌드 때 정적 HTML 로 만든다 (그 밖의 주소는 404)
export const dynamicParams = false;

export async function generateStaticParams() {
  const certs = await getCertList();
  return certs.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert) return {};
  // 문제가 없는 "준비 중" 페이지는 검색엔진에 색인시키지 않는다
  return toMetadata(certMainMeta(cert), { noindex: !cert.ready });
}

const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

export default async function CertPage({ params }: Props) {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert) notFound();

  const meta = certMainMeta(cert);
  const allCerts = await getCertList();
  const related = cert.relatedCertIds
    .map((id) => allCerts.find((c) => c.id === id))
    .filter((c) => c !== undefined);
  const crumbs = [
    { name: "홈", path: "/" },
    { name: cert.name, path: meta.path },
  ];

  if (!cert.ready || !cert.examInfo || !cert.content) {
    const readyCerts = allCerts.filter((c) => c.ready);
    return (
      <article className="space-y-6">
        <Breadcrumbs crumbs={crumbs} />
        <header>
          <div className="flex flex-wrap gap-2">
            <Badge>{cert.grade}</Badge>
            <Badge>{cert.field}</Badge>
            <Badge tone="warn">준비 중</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{meta.h1}</h1>
        </header>
        <p className="card p-4 sm:p-5">
          {cert.name} 필기 문제와 출제 분석은 아직 준비하고 있습니다. 현장에서 많이 응시하는
          자격증부터 차례로 추가하고 있으니 조금만 기다려 주세요.
        </p>
        {readyCerts.length > 0 && (
          <section aria-labelledby="ready-title">
            <h2 id="ready-title" className="text-xl font-extrabold">
              지금 풀 수 있는 자격증
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {readyCerts.map((c) => (
                <li key={c.id}>
                  <Link href={`/cert/${c.id}`} className="btn btn-primary btn-lg">
                    {c.name} 문제 풀러 가기 →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <RelatedCerts certName={cert.name} related={related} />
      </article>
    );
  }

  const questions = await getQuestions(cert.id);
  const scopes = ["all", ...cert.subjects.map((s) => s.id)];
  const counts = Object.fromEntries(
    LEVELS.map((level) => [
      level,
      Object.fromEntries(scopes.map((scope) => [scope, countAvailable(questions, level, scope)])),
    ]),
  ) as Record<QuizLevel, Record<string, number>>;
  const pastCount = questions.filter((q) => q.source === "past").length;
  const cbtCount = Math.min(cert.examInfo.totalQuestions, questions.length);
  const pastMeta = certPastMeta(cert, pastCount > 0, 0);
  const { examInfo, content } = cert;

  return (
    <article className="space-y-8">
      <JsonLd data={faqJsonLd(content.faqs)} />
      <Breadcrumbs crumbs={crumbs} />

      <header className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{cert.grade}</Badge>
          <Badge>{cert.field}</Badge>
        </div>
        <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">{meta.h1}</h1>

        <dl className="card grid gap-x-4 gap-y-2 p-3 sm:grid-cols-[7rem_1fr] sm:p-4">
          <dt className="font-bold text-ink-sub">시험 과목</dt>
          <dd>
            {cert.subjects.map((s) => `${s.name} ${s.questionCount}문항`).join(" · ")}
          </dd>
          <dt className="font-bold text-ink-sub">문항·시간</dt>
          <dd>
            총 {examInfo.totalQuestions}문항 · {examInfo.timeLimitMinutes}분
          </dd>
          <dt className="font-bold text-ink-sub">시험 방식</dt>
          <dd>{examInfo.format}</dd>
          <dt className="font-bold text-ink-sub">합격 기준</dt>
          <dd className="font-bold">{examInfo.passCriteria.description}</dd>
        </dl>

        <CertQuickActions certId={cert.id} />
      </header>

      <CertTabs
        analysis={<AnalysisPanel certId={cert.id} subjects={cert.subjects} />}
        start={
          <StartPanel
            certId={cert.id}
            certName={cert.name}
            subjects={cert.subjects.map((s) => ({ id: s.id, name: s.name }))}
            counts={counts}
            pastCount={pastCount}
            cbt={{
              questionCount: cbtCount,
              minutes: Math.round(mockExamSeconds(cbtCount, examInfo) / 60),
            }}
          />
        }
      />

      <section aria-labelledby="intro-title" className="cv space-y-2">
        <h2 id="intro-title" className="text-xl font-extrabold">
          {cert.name}는 어떤 자격증인가요?
        </h2>
        <p>{content.intro}</p>
        <dl className="card grid gap-x-4 gap-y-2 p-3 sm:grid-cols-[7rem_1fr] sm:p-4">
          <dt className="font-bold text-ink-sub">시행기관</dt>
          <dd>{content.organizer}</dd>
          <dt className="font-bold text-ink-sub">응시자격</dt>
          <dd>{content.eligibility}</dd>
        </dl>
      </section>

      <section aria-labelledby="trend-title" className="cv space-y-2">
        <h2 id="trend-title" className="text-xl font-extrabold">
          {cert.name} 필기 출제 경향 요약
        </h2>
        <p>{content.trendSummary}</p>
        <h3 className="pt-2 text-lg font-bold">이렇게 공부하세요</h3>
        <p>{content.studyTip}</p>
        <p>
          <Link href={pastMeta.path} className="link">
            {pastMeta.h1} 보러 가기 →
          </Link>
        </p>
      </section>

      <section aria-labelledby="faq-title" className="cv">
        <h2 id="faq-title" className="text-xl font-extrabold">
          자주 묻는 질문
        </h2>
        <dl className="mt-2 space-y-3">
          {content.faqs.map((faq) => (
            <div key={faq.question} className="card p-3 sm:p-4">
              <dt className="font-bold">Q. {faq.question}</dt>
              <dd className="mt-1">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <RelatedCerts certName={cert.name} related={related} />

      <AdSlot position="cert-bottom" />
    </article>
  );
}
