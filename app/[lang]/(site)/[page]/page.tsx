import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { INFO_PAGE_IDS, getInfoPage, infoPageMeta, isInfoPageId } from "@/content/pages";
import { LOCALES, getMessages, isLocale } from "@/lib/i18n";
import { toMetadata } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

type Props = { params: Promise<{ lang: string; page: string }> };

// 안내 페이지(소개·문의·개인정보처리방침·이용약관·면책 고지)만 만든다. 그 밖의 주소는 404
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => INFO_PAGE_IDS.map((page) => ({ lang, page })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, page } = await params;
  if (!isLocale(lang) || !isInfoPageId(page)) return {};
  return toMetadata(lang, infoPageMeta(lang, page), { shared: `/${page}` });
}

export default async function InfoPage({ params }: Props) {
  const { lang, page } = await params;
  if (!isLocale(lang) || !isInfoPageId(page)) notFound();
  const m = getMessages(lang).info;
  const content = getInfoPage(lang, page, CONTACT_EMAIL);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-center text-xl font-bold sm:text-2xl">{content.title}</h1>
      {content.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-lg font-bold">{section.heading}</h2>
          <Markdown text={section.body} />
        </section>
      ))}
      {CONTACT_EMAIL && (
        <p className="border-t border-line-soft pt-4 font-bold">
          {m.contact}{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="link">
            {CONTACT_EMAIL}
          </a>
        </p>
      )}
    </article>
  );
}
