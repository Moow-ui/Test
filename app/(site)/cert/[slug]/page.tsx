import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Fold } from "@/components/Fold";
import { JsonLd } from "@/components/JsonLd";
import { AnalysisPanel } from "@/components/cert/AnalysisPanel";
import { CertBoxes } from "@/components/cert/CertBoxes";
import { RelatedCerts } from "@/components/cert/RelatedCerts";
import { getCertList, getCertification, getQuestions } from "@/lib/data";
import { countAvailable, mockExamSeconds } from "@/lib/quiz-engine";
import { certMainMeta, certOgImagePath, certPastMeta, faqJsonLd, toMetadata } from "@/lib/seo";
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
  return toMetadata(certMainMeta(cert), { noindex: !cert.ready, ogImagePath: certOgImagePath(cert.id) });
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
  const cbtCount = examInfo ? Math.min(examInfo.totalQuestions, questions.length) : 0;
  const pastMeta = certPastMeta(cert, pastCount > 0, 0);

  return (
    <article className="space-y-5">
      {content && <JsonLd data={faqJsonLd(content.faqs)} />}
      <Breadcrumbs
        crumbs={[
          { name: "홈", path: "/" },
          { name: cert.name, path: meta.path },
        ]}
      />

      <h1 className="text-center text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl">{meta.h1}</h1>

      {/* 가장 먼저 보이는 큰 박스: 초급 / 중급 / 고급, 그 아래 실전 CBT 체험 */}
      <CertBoxes
        certId={cert.id}
        ready={cert.ready}
        subjects={cert.subjects.map((s) => ({ id: s.id, name: s.name }))}
        counts={counts}
        cbt={
          cert.ready && examInfo
            ? { questionCount: cbtCount, minutes: Math.round(mockExamSeconds(cbtCount, examInfo) / 60) }
            : null
        }
      />

      {!cert.ready && (
        <p className="card p-4">
          {cert.name} 문제는 아직 준비하고 있습니다.
          {allCerts
            .filter((c) => c.ready)
            .map((c) => (
              <Link key={c.id} href={`/cert/${c.id}`} className="link ml-2">
                {c.name} 문제 풀러 가기 →
              </Link>
            ))}
        </p>
      )}

      {/* 시험 정보·출제 분석은 아래에 접어 둔다 (내용은 HTML 에 그대로 있음) */}
      {examInfo && (
        <div className="space-y-2 pt-3">
          <Fold title="시험 정보">
            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-[6rem_1fr]">
              <dt className="font-bold text-ink-sub">등급·분야</dt>
              <dd>
                {cert.grade} · {cert.field}
              </dd>
              <dt className="font-bold text-ink-sub">시험 과목</dt>
              <dd>{cert.subjects.map((s) => `${s.name} ${s.questionCount}문항`).join(" · ")}</dd>
              <dt className="font-bold text-ink-sub">문항·시간</dt>
              <dd>
                총 {examInfo.totalQuestions}문항 · {examInfo.timeLimitMinutes}분
              </dd>
              <dt className="font-bold text-ink-sub">시험 방식</dt>
              <dd>{examInfo.format}</dd>
              <dt className="font-bold text-ink-sub">합격 기준</dt>
              <dd className="font-bold">{examInfo.passCriteria.description}</dd>
              {content && (
                <>
                  <dt className="font-bold text-ink-sub">시행기관</dt>
                  <dd>{content.organizer}</dd>
                  <dt className="font-bold text-ink-sub">응시자격</dt>
                  <dd>{content.eligibility}</dd>
                </>
              )}
            </dl>
          </Fold>

          <Fold title="출제 분석">
            <AnalysisPanel certId={cert.id} subjects={cert.subjects} linkChapters={cert.ready} />
          </Fold>
        </div>
      )}

      <RelatedCerts certName={cert.name} related={related} />

      {/* 읽을거리(출제 경향·자격증 소개·자주 묻는 질문)는 맨 아래에 작게 접어 둔다 */}
      {content && (
        <details className="pt-6 text-[0.85rem]">
          <summary className="inline-flex min-h-10 items-center font-bold text-ink-sub underline underline-offset-2">
            <span className="when-closed">▼ {cert.name} 더 알아보기 (출제 경향 · 자격증 소개 · 자주 묻는 질문)</span>
            <span className="when-open">▲ 접기</span>
          </summary>
          <div className="mt-2 space-y-5">
            <section className="space-y-2">
              <h2 className="font-extrabold">{cert.name} 필기 출제 경향 요약</h2>
              <p>{content.trendSummary}</p>
              <p>{content.studyTip}</p>
              {cert.ready && (
                <p>
                  <Link href={pastMeta.path} className="link">
                    {pastMeta.h1} 보러 가기 →
                  </Link>
                </p>
              )}
            </section>
            <section className="space-y-2">
              <h2 className="font-extrabold">{cert.name}는 어떤 자격증인가요?</h2>
              <p>{content.intro}</p>
            </section>
            <section>
              <h2 className="font-extrabold">자주 묻는 질문</h2>
              <dl className="mt-2 space-y-3">
                {content.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="font-bold">Q. {faq.question}</dt>
                    <dd className="mt-1">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </details>
      )}

      <AdSlot position="cert-bottom" />
    </article>
  );
}
