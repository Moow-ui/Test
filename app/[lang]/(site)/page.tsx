import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { LogoMark } from "@/components/LogoMark";
import { CertGrid } from "@/components/home/CertGrid";
import { CertSearch } from "@/components/home/CertSearch";
import { DailyQuestion } from "@/components/home/DailyQuestion";
import { QuickStart } from "@/components/home/QuickStart";
import { getCertList, getConcepts } from "@/lib/data";
import { brandName, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { absoluteUrl } from "@/lib/site";

// title·description·canonical·hreflang 은 app/[lang]/layout.tsx 의 것을 그대로 쓴다 (홈)

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang);

  // 그 나라의 자격증만 보여 준다 (번역이 아니라 나라별 별도 콘텐츠)
  const certs = await getCertList(localeCountry(lang));
  // 개념 정리(검증 통과 단원)가 있는 자격증 → 목록 카드의 "개념" 배지
  const conceptIds = (
    await Promise.all(certs.filter((c) => c.ready).map(async (c) => ((await getConcepts(c.id)) ? c.id : null)))
  ).filter((id): id is string => !!id);

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

      {/* 순서: 제목 → 검색창(바로 아래 오늘의 1문제) → 최근 공부한 자격증(첫 방문이면 많이 찾는 자격증) → 맨 아래 전체 목록 */}
      <div className="flex flex-col items-center gap-4 pt-4 text-center sm:pt-8">
        <LogoMark size={56} />
        <h1 className="text-xl font-bold leading-snug tracking-tight sm:text-2xl">
          {m.home.h1a}
          <br />
          <span className="text-accent underline decoration-primary decoration-4 underline-offset-8">{m.home.h1b}</span>
        </h1>
      </div>

      <CertSearch certs={certs} />

      {/* 풀 수 있는 자격증이 있을 때만 */}
      {certs.some((c) => c.ready) && <DailyQuestion />}
      {certs.some((c) => c.ready) && <QuickStart certs={certs} />}

      {/* 전체 자격증 목록: 검색엔진이 모든 자격증 페이지를 찾을 수 있게 카드 링크를 서버 HTML 에 모두 그린다 */}
      <CertGrid certs={certs} conceptIds={conceptIds} />

      <AdSlot position="home-bottom" />
    </div>
  );
}
