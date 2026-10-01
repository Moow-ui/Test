import type { Metadata } from "next";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { CertExplorer } from "@/components/home/CertExplorer";
import { QuickStart } from "@/components/home/QuickStart";
import { getCertList } from "@/lib/data";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} | 국가기술자격 필기 기출·예상문제 무료 풀이`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

export default async function HomePage() {
  const certs = await getCertList();
  const featured = certs.find((c) => c.ready) ?? certs[0];
  const readyCount = certs.filter((c) => c.ready).length;

  return (
    <div className="space-y-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
          inLanguage: "ko",
        }}
      />

      <div>
        <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">
          국가기술자격 필기,
          <br className="sm:hidden" /> 합격에 필요한 것만 중요한 순서대로
        </h1>
        <p className="mt-2 text-ink-sub">
          쉬는 시간 5분이면 5문제. 한 문제씩 풀고 그 자리에서 정답과 쉬운 해설을 확인하세요.
        </p>
      </div>

      <QuickStart certs={certs} featuredId={featured.id} />

      <CertExplorer certs={certs} />

      <section aria-labelledby="about-title" className="cv card p-4 sm:p-5">
        <h2 id="about-title" className="text-lg font-extrabold">
          큐패스는 이렇게 씁니다
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          <li>자격증을 고르면 과목·단원별로 무엇이 얼마나 나오는지(출제 분석) 먼저 보여 줍니다.</li>
          <li>초급·중급·고급 중 하나를 고르고 5문제부터 풉니다.</li>
          <li>답을 누르면 바로 채점되고, 한 줄 핵심과 쉬운 말로 쓴 해설이 나옵니다.</li>
          <li>틀린 문제는 오답노트에 담아 두었다가 다시 풀거나 종이로 인쇄할 수 있습니다.</li>
        </ol>
        <p className="mt-3 text-[0.9rem] text-ink-sub">
          현재 {readyCount}개 자격증의 문제를 풀 수 있고, 나머지 자격증은 현장에서 많이 응시하는
          순서대로 준비하고 있습니다.
        </p>
      </section>

      <AdSlot position="home-bottom" />
    </div>
  );
}
