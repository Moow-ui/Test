import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { getCertification, getQuestions, getReadyCertifications } from "@/lib/data";
import { noindexMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const certs = await getReadyCertifications();
  return certs.map((c) => ({ slug: c.id }));
}

// 풀이 화면은 사람마다 내용이 다르고 검색엔진이 읽을 본문이 없으므로 색인하지 않는다
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert) return {};
  return noindexMetadata(
    `${cert.name} 문제 풀기 | ${SITE_NAME}`,
    `${cert.name} 문제를 한 문제씩 풀고 바로 채점합니다.`,
  );
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert?.ready || !cert.examInfo) notFound();
  const questions = await getQuestions(cert.id);

  return (
    <Suspense fallback={<p className="p-5 text-lg font-bold">문제를 준비하고 있습니다…</p>}>
      <QuizRunner
        cert={{ id: cert.id, name: cert.name, subjects: cert.subjects, examInfo: cert.examInfo }}
        questions={questions}
      />
    </Suspense>
  );
}
