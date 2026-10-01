import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CbtRunner } from "@/components/cbt/CbtRunner";
import { getCertificationIn, getQuestions } from "@/lib/data";
import { getMessages, isLocale, localeCountry } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";
import { readyCertParams } from "@/lib/static-params";

type Props = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = readyCertParams;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert) return {};
  return noindexMetadata(lang, getMessages(lang).seo.cbt, `/cert/${cert.id}/cbt`, {
    vars: { name: cert.name },
  });
}

export default async function CbtPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert?.ready || !cert.examInfo) notFound();
  const questions = await getQuestions(cert.id);

  return (
    <CbtRunner
      cert={{ id: cert.id, name: cert.name, subjects: cert.subjects, examInfo: cert.examInfo }}
      questions={questions}
    />
  );
}
