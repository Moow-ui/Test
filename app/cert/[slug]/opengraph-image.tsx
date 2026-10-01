import { getCertList, getCertification } from "@/lib/data";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "자격증 필기 기출문제·출제경향";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// 자격증별 OG 이미지도 빌드 때 미리 만들어 둔다
export async function generateStaticParams() {
  const certs = await getCertList();
  return certs.map((c) => ({ slug: c.id }));
}

/** 자격증별 OG 이미지 (자격증 메인·기출·단원 페이지가 함께 쓴다) */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cert = await getCertification(slug);

  if (!cert) {
    return renderOgImage({ eyebrow: "자격증", title: "국가기술자격 필기", subtitle: "문제 풀이" });
  }
  return renderOgImage({
    eyebrow: `${cert.grade} · ${cert.field}`,
    title: cert.name,
    subtitle:
      cert.ready && cert.examInfo
        ? `필기 ${cert.examInfo.totalQuestions}문항 출제 분석 · 문제 풀이 + 해설`
        : "필기 문제 준비 중",
  });
}
