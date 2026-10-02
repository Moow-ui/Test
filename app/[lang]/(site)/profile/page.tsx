import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { getCertList } from "@/lib/data";
import { getMessages, isLocale, localeCountry } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.profile, "/profile", { shared: "/profile" });
}

export default async function ProfilePage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const certs = await getCertList(localeCountry(lang));
  return (
    <ProfileView certs={certs.map((c) => ({ id: c.id, name: c.name, grade: c.grade ?? null, ready: c.ready }))} />
  );
}
