import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getGuides } from "@/lib/data";
import { LOCALES, fmt, getMessages, isLocale, localePath } from "@/lib/i18n";
import { guideListMeta, toMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// 글이 하나도 없는 언어는 검색에서 제외(noindex)한다 (sitemap 에도 넣지 않는다)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const guides = await getGuides(lang);
  return toMetadata(lang, guideListMeta(lang), { noindex: guides.length === 0 });
}

/** 수험 정보 목록 (새 글이 위). 글은 data/guides/{lang}/ — 매일 00:52 루틴이 1편씩 추가한다 */
export default async function GuideListPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);
  const meta = guideListMeta(lang);
  const guides = await getGuides(lang);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: m.guide.breadcrumb, path: meta.path },
        ]}
      />
      <h1 className="text-xl font-bold sm:text-2xl">{meta.h1}</h1>
      <p className="text-ink-sub">{m.guide.listIntro}</p>
      {guides.length === 0 && <p className="card p-6 text-ink-sub">{m.guide.empty}</p>}
      <ul className="divide-y divide-line-soft border-y border-line-soft">
        {guides.map((g) => (
          <li key={g.slug} className="space-y-1 py-4">
            <p className="text-sm text-ink-sub">
              <span className="font-bold">{m.guide.categories[g.category]}</span> ·{" "}
              <span className="tabular-nums">{fmt(m.guide.published, { date: g.publishedAt })}</span>
            </p>
            <h2 className="text-lg font-bold">
              <Link href={`${meta.path}/${g.slug}`} className="link">
                {g.title}
              </Link>
            </h2>
            <p className="text-ink-sub">{g.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
