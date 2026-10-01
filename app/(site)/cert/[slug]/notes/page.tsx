import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesView } from "@/components/notes/NotesView";
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
    `${cert.name} 오답노트 | ${SITE_NAME}`,
    `${cert.name} 문제 중 틀린 문제를 모아 다시 풀고 인쇄합니다.`,
  );
}

export default async function CertNotesPage({ params }: Props) {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert?.ready) notFound();
  const questions = await getQuestions(cert.id);

  return (
    <NotesView cert={{ id: cert.id, name: cert.name, subjects: cert.subjects }} questions={questions} />
  );
}
