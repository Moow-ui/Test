import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesView } from "@/components/notes/NotesView";
import { getCertificationIn } from "@/lib/data";
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
  return noindexMetadata(lang, getMessages(lang).seo.certNotes, `/cert/${cert.id}/notes`, {
    vars: { name: cert.name },
  });
}

export default async function CertNotesPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const cert = await getCertificationIn(localeCountry(lang), slug);
  if (!cert?.ready) notFound();

  return <NotesView cert={{ id: cert.id, name: cert.name, subjects: cert.subjects }} />;
}
