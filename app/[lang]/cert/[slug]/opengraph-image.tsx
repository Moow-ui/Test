import { getCertificationIn } from "@/lib/data";
import { DEFAULT_LOCALE, brandName, fmt, getMessages, isLocale, localeCountry } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { certParams } from "@/lib/static-params";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// 자격증별 OG 이미지도 빌드 때 미리 만들어 둔다
export const generateStaticParams = certParams;

/** 자격증별 OG 이미지 (자격증 메인·기출·단원 페이지가 함께 쓴다) */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const m = getMessages(locale);
  const cert = await getCertificationIn(localeCountry(locale), slug);
  const common = { brand: brandName(locale), tagline: m.site.tagline };

  if (!cert) {
    return renderOgImage({
      ...common,
      eyebrow: m.og.homeEyebrow,
      title: m.og.homeTitle,
      subtitle: m.og.homeSubtitle,
    });
  }
  return renderOgImage({
    ...common,
    eyebrow: fmt(m.og.certEyebrow, { grade: cert.grade, field: cert.field }),
    title: cert.name,
    subtitle:
      cert.ready && cert.examInfo
        ? fmt(m.og.certSubtitle, { n: cert.examInfo.totalQuestions })
        : m.og.certSoon,
  });
}
