import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { CertSearch } from "@/components/home/CertSearch";
import { QuickStart } from "@/components/home/QuickStart";
import { getCertList } from "@/lib/data";
import Link from "next/link";
import { brandName, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

// title·description·canonical·hreflang 은 app/[lang]/layout.tsx 의 것을 그대로 쓴다 (홈)

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);

  // 그 나라의 자격증만 보여 준다 (번역이 아니라 나라별 별도 콘텐츠)
  const certs = await getCertList(localeCountry(lang));

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

      {/* 순서: 제목 → 검색창 → 최근 공부한 자격증(첫 방문이면 많이 찾는 자격증) → 맨 아래 전체 목록 */}
      <h1 className="pt-4 text-center text-xl font-bold leading-snug tracking-tight sm:pt-8 sm:text-2xl">
        {m.home.h1a}
        <br />
        <span className="text-accent">{m.home.h1b}</span>
      </h1>

      <CertSearch certs={certs} />

      {/* 풀 수 있는 자격증이 있을 때만 */}
      {certs.some((c) => c.ready) && <QuickStart certs={certs} />}

      {/* 전체 자격증 목록: 검색엔진이 모든 자격증 페이지를 찾을 수 있게 서버에서 일반 링크로 그린다 */}
      <nav aria-labelledby="all-certs-title" className="cv pt-8">
        <h2 id="all-certs-title" className="text-lg font-bold">
          {m.home.allCerts}
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <li key={c.id}>
              <Link href={localePath(lang, `/cert/${c.id}`)} className="link inline-flex min-h-11 items-center">
                {c.name}
              </Link>
              {!c.ready && <span className="ml-2 text-sm text-ink-sub">{m.common.comingSoon}</span>}
            </li>
          ))}
        </ul>
      </nav>

      <AdSlot position="home-bottom" />
    </div>
  );
}
