import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { CertExplorer } from "@/components/home/CertExplorer";
import { QuickStart } from "@/components/home/QuickStart";
import { getCertList } from "@/lib/data";
import { brandName, fmt, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

// title·description·canonical·hreflang 은 app/[lang]/layout.tsx 의 것을 그대로 쓴다 (홈)

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);

  // 그 나라의 자격증만 보여 준다 (번역이 아니라 나라별 별도 콘텐츠)
  const certs = await getCertList(localeCountry(lang));
  const featured = certs.find((c) => c.ready);
  const readyCount = certs.filter((c) => c.ready).length;

  return (
    <div className="space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: brandName(lang),
          url: absoluteUrl(localePath(lang)),
          description: m.site.description,
          inLanguage: lang,
        }}
      />

      <h1 className="pt-3 text-center text-[1.7rem] font-extrabold leading-snug tracking-tight sm:pt-6 sm:text-4xl">
        {m.home.h1a}
        <br />
        <span className="text-accent">{m.home.h1b}</span>
      </h1>

      {/* 풀 수 있는 자격증이 있을 때만 "바로 풀기" 를 보여 준다 */}
      {featured && <QuickStart certs={certs} featuredId={featured.id} />}

      <CertExplorer certs={certs} />

      <section aria-labelledby="about-title" className="cv card p-4 sm:p-5">
        <h2 id="about-title" className="text-center text-lg font-extrabold">
          {m.home.howTitle}
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          {m.home.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        {readyCount > 0 && (
          <p className="mt-3 text-[0.9rem] text-ink-sub">{fmt(m.home.readyCount, { n: readyCount })}</p>
        )}
      </section>

      <AdSlot position="home-bottom" />
    </div>
  );
}
