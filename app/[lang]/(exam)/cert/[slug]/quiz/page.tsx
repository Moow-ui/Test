import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { QuizRunner } from "@/components/quiz/QuizRunner";
import { getCertificationIn } from "@/lib/data";
import { getMessages, isLocale, localeCountry } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";
import { readyCertParams } from "@/lib/static-params";

type Props = { params: Promise<{ lang: string; slug: string }> };

export const dynamicParams = false;

export const generateStaticParams = readyCertParams;

// 풀이 화면은 사람마다 내용이 다르고 검색엔진이 읽을 본문이 없으므로 색인하지 않는다
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert) return {};
  return noindexMetadata(lang, getMessages(lang).seo.quiz, `/cert/${cert.id}/quiz`, {
    vars: { name: cert.name },
  });
}

export default async function QuizPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert?.ready || !cert.examInfo) notFound();

  return (
    <Suspense fallback={<p className="p-6 text-lg font-bold">{getMessages(lang).quiz.preparing}</p>}>
      <QuizRunner
        cert={{ id: cert.id, name: cert.name, subjects: cert.subjects, examInfo: cert.examInfo }}
      />
    </Suspense>
  );
}
