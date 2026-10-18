import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GuideList, type GuideListItem } from "@/components/guide/GuideList";
import { getCertificationIn, getGuides } from "@/lib/data";
import { guideTexts, readingMinutes } from "@/lib/format";
import { isGuideExpired } from "@/lib/guide-quality";
import { LOCALES, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { GUIDE_CATEGORIES } from "@/lib/schemas";
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
  return toMetadata(lang, guideListMeta(lang), {
    noindex: guides.length === 0,
  });
}

/** 수험 정보 목록 (새 글이 위). 글은 data/guides/{lang}/ — 매일 00:52 루틴이 1편씩 추가한다 */
export default async function GuideListPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);
  const meta = guideListMeta(lang);
  const guides = await getGuides(lang);

  // 목록 줄에 보일 관련 자격증 이름 (첫 번째 certIds)
  const items: GuideListItem[] = await Promise.all(
    guides.map(async (g) => {
      const cert = g.certIds[0] ? await getCertificationIn(localeCountry(lang), g.certIds[0]) : null;
      return {
        slug: g.slug,
        title: g.title,
        description: g.description,
        category: g.category,
        publishedAt: g.publishedAt,
        minutes: readingMinutes(guideTexts(g), lang),
        certName: cert?.name,
        expired: isGuideExpired(g),
      };
    }),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: m.guide.breadcrumb, path: meta.path },
        ]}
      />
      <header className="space-y-2 pb-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{meta.h1}</h1>
        <p className="text-ink-sub">{m.guide.listIntro}</p>
      </header>
      {/* 작성 원칙: AI 작성 사실과 출처 기준을 먼저 밝힌다 */}
      <section aria-labelledby="policy-title" className="rounded-xl border border-line bg-surface px-5 py-4 text-sm">
        <h2 id="policy-title" className="font-bold">
          {m.guide.policyTitle}
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-sub">
          {m.guide.policy.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-2">
          <Link href={localePath(lang, "/contact")} className="link">
            {m.guide.reportError}
          </Link>
        </p>
      </section>
      {items.length === 0 ? (
        <p className="card p-6 text-ink-sub">{m.guide.empty}</p>
      ) : (
        <GuideList items={items} listPath={meta.path} categories={[...GUIDE_CATEGORIES]} />
      )}
    </div>
  );
}
