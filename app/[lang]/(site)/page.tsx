import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { CertExplorer } from "@/components/home/CertExplorer";
import { QuickStart } from "@/components/home/QuickStart";
import { getCertList } from "@/lib/data";
import { brandName, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

// title·description·canonical·hreflang 은 app/[lang]/layout.tsx 의 것을 그대로 쓴다 (홈)

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);

  // 그 나라의 자격증만 보여 준다 (번역이 아니라 나라별 별도 콘텐츠)
  const certs = await getCertList(localeCountry(lang));
  const featured = certs.find((c) => c.ready);

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

      {/* 사용법은 한 문장으로만 (첫 화면은 짧게) */}
      <p className="cv card p-4 text-center">
        <strong className="mr-2">{m.home.howTitle}</strong>
        {m.home.how}
      </p>

      <AdSlot position="home-bottom" />
    </div>
  );
}
