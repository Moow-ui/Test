import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CbtRunner } from "@/components/cbt/CbtRunner";
import { getCertification, getQuestions, getReadyCertifications } from "@/lib/data";
import { noindexMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const certs = await getReadyCertifications();
  return certs.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert) return {};
  return noindexMetadata(
    `${cert.name} 실전 CBT 체험 | ${SITE_NAME}`,
    `${cert.name} 필기를 실제 CBT 시험 화면처럼 제한 시간 안에 풀어 봅니다.`,
  );
}

export default async function CbtPage({ params }: Props) {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert?.ready || !cert.examInfo) notFound();
  const questions = await getQuestions(cert.id);

  return (
    <CbtRunner
      cert={{ id: cert.id, name: cert.name, subjects: cert.subjects, examInfo: cert.examInfo }}
      questions={questions}
    />
  );
}
