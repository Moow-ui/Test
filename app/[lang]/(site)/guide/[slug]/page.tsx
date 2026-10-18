import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LogoMark } from "@/components/LogoMark";
import { Markdown } from "@/components/Markdown";
import { CategoryIcon } from "@/components/guide/CategoryIcon";
import { getCertificationIn, getGuide, getGuides } from "@/lib/data";
import { guideTexts, readingMinutes } from "@/lib/format";
import { isGuideExpired } from "@/lib/guide-quality";
import { LOCALES, brandName, fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { faqJsonLd, guideJsonLd, guideListMeta, guideMeta, toMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string; slug: string }> };

// 글 파일이 있는 주소만 빌드 때 정적 HTML 로 만든다
export const dynamicParams = false;

/** 모든 언어의 주소를 한꺼번에 돌려준다 (lib/static-params.ts 와 같은 이유) */
export async function generateStaticParams() {
  const result: Array<{ lang: string; slug: string }> = [];
  for (const lang of LOCALES) for (const g of await getGuides(lang)) result.push({ lang, slug: g.slug });
  return result;
}

async function load(lang: string, slug: string) {
  if (!isLocale(lang)) return null;
  const guide = await getGuide(lang, slug);
  return guide ? { lang, guide } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const found = await load(lang, slug);
  if (!found) return {};
  // 일정이 지난 글은 화면에는 남기되 검색 색인에서 뺀다 (지난 정보가 검색에 걸리지 않게)
  return toMetadata(found.lang, guideMeta(found.lang, found.guide), {
    noindex: isGuideExpired(found.guide),
  });
}

/**
 * 수험 정보 글 (블로그 글 모양):
 * 분류 → 제목 → 글쓴이 줄(사이트·AI 작성·날짜·읽는 시간) → 정보 기준일 → 목차 → 본문 → 문제 풀기 → 자주 묻는 질문
 * → 확인한 출처 → 이전 글·다음 글 → 같은 분류의 다른 글 → 목록으로.
 */
export default async function GuidePage({ params }: Props) {
  const { lang: rawLang, slug } = await params;
  const found = await load(rawLang, slug);
  if (!found) notFound();
  const { lang, guide } = found;
  const m = getMessages(lang);
  const t = m.guide;
  const meta = guideMeta(lang, guide);
  const list = guideListMeta(lang);
  const minutes = readingMinutes(guideTexts(guide), lang);
  const expired = isGuideExpired(guide);

  const certs = (await Promise.all(guide.certIds.map((id) => getCertificationIn(localeCountry(lang), id)))).filter(
    (c) => c !== null,
  );

  // 목록은 새 글이 위: 바로 아래가 이전 글, 바로 위가 다음 글
  const all = await getGuides(lang);
  const at = all.findIndex((g) => g.slug === guide.slug);
  const older = all[at + 1];
  const newer = at > 0 ? all[at - 1] : undefined;
  const others = all.filter((g) => g.slug !== guide.slug);
  const sameCategory = others.filter((g) => g.category === guide.category).slice(0, 5);
  const moreList = sameCategory.length > 0 ? sameCategory : others.slice(0, 5);
  const moreTitle =
    sameCategory.length > 0 ? fmt(t.sameCategory, { category: t.categories[guide.category] }) : t.moreTitle;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <JsonLd data={guideJsonLd(lang, meta, guide)} />
      {guide.faq && guide.faq.length > 0 && <JsonLd data={faqJsonLd(guide.faq)} />}
      <Breadcrumbs
        label={m.nav.breadcrumb}
        crumbs={[
          { name: m.nav.home, path: localePath(lang) },
          { name: t.breadcrumb, path: list.path },
          { name: guide.title, path: meta.path },
        ]}
      />

      {/* 글 본문: 흰 바탕 상자 하나 (배경과 구분) */}
      <article className="card space-y-8 px-5 py-6 sm:px-10 sm:py-10">
        {/* 글 머리: 분류 · 제목 · 글쓴이 줄 · 정보 기준일 */}
        <header className="space-y-4 border-b border-line pb-6">
          <Link
            href={`${list.path}#c=${guide.category}`}
            className="link-quiet inline-flex min-h-10 items-center gap-2 text-accent"
          >
            <CategoryIcon category={guide.category} size={20} />
            {t.categories[guide.category]}
          </Link>
          <h1 className="text-balance text-2xl font-bold leading-snug sm:text-3xl">{meta.h1}</h1>
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-bold">
                {brandName(lang)}
                <span className="rounded-md border border-line px-2 py-0.5 text-sm font-bold text-ink-sub">
                  {t.aiBadge}
                </span>
              </p>
              <p className="text-sm tabular-nums text-ink-sub">
                {fmt(t.published, { date: guide.publishedAt })}
                {guide.updatedAt && guide.updatedAt !== guide.publishedAt && (
                  <> · {fmt(t.updated, { date: guide.updatedAt })}</>
                )}
                {" · "}
                {fmt(t.readTime, { n: minutes })}
              </p>
            </div>
          </div>
          {expired && guide.validUntil ? (
            <p role="note" className="rounded-lg border-2 border-bad bg-bad-soft px-4 py-3 font-bold">
              {fmt(t.expiredNotice, { date: guide.validUntil })}
            </p>
          ) : null}
          <p className="rounded-lg bg-surface-2 px-4 py-3 text-sm">
            <strong className="tabular-nums">{fmt(t.basis, { date: guide.basisDate })}</strong> · {t.basisNote}
          </p>
        </header>

        <div className="guide-prose">
          <Markdown text={guide.intro} />
        </div>

        {/* 목차 */}
        <nav aria-labelledby="toc-title" className="space-y-2 rounded-xl bg-surface-2 p-5">
          <h2 id="toc-title" className="font-bold">
            {t.toc}
          </h2>
          <ol className="list-decimal space-y-1 pl-6">
            {guide.sections.map((section, i) => (
              <li key={section.heading}>
                <a href={`#s${i}`} className="link-quiet underline-offset-2 hover:underline">
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {guide.sections.map((section, i) => (
          <section key={section.heading} aria-labelledby={`s${i}`} className="space-y-4">
            <h2 id={`s${i}`} className="scroll-mt-24 border-l-4 border-primary pl-3 text-lg font-bold leading-snug">
              {section.heading}
            </h2>
            <div className="guide-prose">
              <Markdown text={section.body} />
            </div>
          </section>
        ))}

        {/* 읽은 뒤 바로 문제 풀기 */}
        {certs.length > 0 && (
          <section aria-labelledby="related-title" className="space-y-3 rounded-2xl bg-primary-soft p-5">
            <h2 id="related-title" className="text-lg font-bold">
              {t.relatedTitle}
            </h2>
            <p>{t.ctaBody}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {certs.map((c, i) => (
                <Link
                  key={c.id}
                  href={localePath(lang, `/cert/${c.id}`)}
                  className={i === 0 ? "btn btn-primary btn-lg" : "btn btn-lg bg-surface"}
                >
                  {fmt(t.solve, { name: c.name })}
                </Link>
              ))}
            </div>
          </section>
        )}

        {guide.faq && guide.faq.length > 0 && (
          <section aria-labelledby="faq-title" className="space-y-3">
            <h2 id="faq-title" className="border-l-4 border-primary pl-3 text-lg font-bold">
              {t.faqTitle}
            </h2>
            <dl className="guide-prose divide-y divide-line border-y border-line">
              {guide.faq.map((f) => (
                <div key={f.question} className="space-y-2 py-4">
                  <dt className="font-bold">Q. {f.question}</dt>
                  <dd>{f.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section aria-labelledby="sources-title" className="space-y-2 border-t border-line pt-6 text-sm">
          <h2 id="sources-title" className="text-base font-bold">
            {t.sourcesTitle}
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            {guide.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} className="link" rel="noopener nofollow" target="_blank">
                  {src.title}
                </a>{" "}
                <span className="tabular-nums text-ink-sub">({fmt(t.checkedAt, { date: src.checkedAt })})</span>
              </li>
            ))}
          </ul>
          <p className="text-ink-sub">
            {t.byline}{" "}
            <Link href={localePath(lang, "/contact")} className="link">
              {t.reportError}
            </Link>
          </p>
        </section>
      </article>

      {/* 이전 글·다음 글, 다른 글: 본문과 다른 흰 상자 */}
      {(older || newer || moreList.length > 0) && (
        <div className="card space-y-6 px-5 py-5 sm:px-10">
          {/* 이전 글 · 다음 글 */}
          {(older || newer) && (
            <nav aria-label={t.prevNextLabel} className="divide-y divide-line border-b border-line">
              {newer && (
                <Link href={`${list.path}/${newer.slug}`} className="group flex gap-3 py-4">
                  <span className="w-16 shrink-0 text-sm font-bold text-ink-sub">{t.next}</span>
                  <span className="min-w-0 flex-1 font-bold group-hover:underline">{newer.title}</span>
                </Link>
              )}
              {older && (
                <Link href={`${list.path}/${older.slug}`} className="group flex gap-3 py-4">
                  <span className="w-16 shrink-0 text-sm font-bold text-ink-sub">{t.prev}</span>
                  <span className="min-w-0 flex-1 font-bold group-hover:underline">{older.title}</span>
                </Link>
              )}
            </nav>
          )}

          {/* 같은 분류의 다른 글 (없으면 최근 글) */}
          {moreList.length > 0 && (
            <nav aria-labelledby="more-title" className="space-y-3">
              <h2 id="more-title" className="text-lg font-bold">
                {moreTitle}
              </h2>
              <ul className="divide-y divide-line-soft">
                {moreList.map((g) => (
                  <li key={g.slug}>
                    <Link href={`${list.path}/${g.slug}`} className="group flex items-baseline gap-3 py-3">
                      <span className="min-w-0 flex-1 group-hover:underline">{g.title}</span>
                      <span className="shrink-0 text-sm tabular-nums text-ink-sub">{g.publishedAt}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      )}

      <p>
        <Link href={list.path} className="btn w-full bg-surface">
          {t.toList}
        </Link>
      </p>
    </div>
  );
}
