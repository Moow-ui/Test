import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { getCertificationIn, getGuide, getGuides } from "@/lib/data";
import { LOCALES, fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
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
  return toMetadata(found.lang, guideMeta(found.lang, found.guide));
}

/**
 * 합격 가이드 글: 제목·날짜·정보 기준일 → 첫 문단 → 소제목별 본문 → 자주 묻는 질문
 * → 관련 자격증 문제 풀기 → 확인한 출처 → 작성 주체 표시 → 다른 가이드.
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

  const certs = (
    await Promise.all(guide.certIds.map((id) => getCertificationIn(localeCountry(lang), id)))
  ).filter((c) => c !== null);
  const others = (await getGuides(lang)).filter((g) => g.slug !== guide.slug).slice(0, 5);

  return (
    <article className="mx-auto max-w-3xl space-y-8">
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

      <header className="space-y-3 border-b border-line-soft pb-6">
        <p className="text-sm font-bold text-accent">{t.categories[guide.category]}</p>
        <h1 className="text-balance text-xl font-bold leading-tight sm:text-2xl">{meta.h1}</h1>
        <p className="text-sm tabular-nums text-ink-sub">
          {fmt(t.published, { date: guide.publishedAt })}
          {guide.updatedAt && guide.updatedAt !== guide.publishedAt && <> · {fmt(t.updated, { date: guide.updatedAt })}</>}
          {" · "}
          {fmt(t.basis, { date: guide.basisDate })}
        </p>
      </header>

      <div className="text-lg">
        <Markdown text={guide.intro} />
      </div>

      {guide.sections.map((section, i) => (
        <section key={section.heading} aria-labelledby={`s${i}`} className="space-y-3">
          <h2 id={`s${i}`} className="text-lg font-bold sm:text-xl">
            {section.heading}
          </h2>
          <Markdown text={section.body} />
        </section>
      ))}

      {guide.faq && guide.faq.length > 0 && (
        <section aria-labelledby="faq-title" className="space-y-3">
          <h2 id="faq-title" className="text-lg font-bold sm:text-xl">
            {t.faqTitle}
          </h2>
          <dl className="space-y-4">
            {guide.faq.map((f) => (
              <div key={f.question} className="card space-y-2 p-4">
                <dt className="font-bold">{f.question}</dt>
                <dd>{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {certs.length > 0 && (
        <section aria-labelledby="related-title" className="space-y-3">
          <h2 id="related-title" className="text-lg font-bold sm:text-xl">
            {t.relatedTitle}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {certs.map((c, i) => (
              <Link
                key={c.id}
                href={localePath(lang, `/cert/${c.id}`)}
                className={i === 0 ? "btn btn-primary btn-lg" : "btn btn-lg"}
              >
                {fmt(t.solve, { name: c.name })}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="sources-title" className="space-y-2 text-sm">
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
        <p className="text-ink-sub">{t.byline}</p>
      </section>

      {others.length > 0 && (
        <nav aria-labelledby="more-title" className="space-y-3 border-t border-line-soft pt-6">
          <h2 id="more-title" className="text-lg font-bold">
            {t.moreTitle}
          </h2>
          <ul className="space-y-2">
            {others.map((g) => (
              <li key={g.slug}>
                <Link href={`${list.path}/${g.slug}`} className="link">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            <Link href={list.path} className="btn w-full">
              {t.toList}
            </Link>
          </p>
        </nav>
      )}
    </article>
  );
}
