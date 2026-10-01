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
    title: `${SITE_NAME} | 자격증 필기 예상문제 무료 풀이`,
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

      <h1 className="pt-3 text-center text-[1.7rem] font-extrabold leading-snug tracking-tight sm:pt-6 sm:text-4xl">
        세상의 모든 자격증.
        <br />
        <span className="text-accent">5분 문제 연습하기.</span>
      </h1>

      <QuickStart certs={certs} featuredId={featured.id} />

      <CertExplorer certs={certs} />

      <section aria-labelledby="about-title" className="cv card p-4 sm:p-5">
        <h2 id="about-title" className="text-center text-lg font-extrabold">
          {SITE_NAME}은 이렇게 씁니다
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6">
          <li>자격증을 고르고 초급·중급·고급 중 하나를 누릅니다.</li>
          <li>실제 시험 화면과 같은 화면에서 5문제부터 풉니다. 답을 누르면 바로 정답과 해설을 볼 수 있습니다.</li>
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
