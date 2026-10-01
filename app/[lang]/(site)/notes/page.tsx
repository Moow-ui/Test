import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotesIndex } from "@/components/notes/NotesIndex";
import { getReadyCertifications } from "@/lib/data";
import { getMessages, isLocale, localeCountry } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.notes, "/notes", { shared: "/notes" });
}

export default async function NotesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);
  const certs = await getReadyCertifications(localeCountry(lang));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">{m.notes.title}</h1>
      <p className="text-ink-sub">{m.notes.intro}</p>
      <NotesIndex certs={certs.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
