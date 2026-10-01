import { DEFAULT_LOCALE, LOCALES, brandName, getMessages, isLocale } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// 언어별 이미지를 빌드 때 미리 만들어 둔다 (실행 중에는 글꼴 파일을 읽을 수 없다)
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** 사이트 기본 OG 이미지 (홈 등). 언어별로 사이트 이름과 문구가 다르다 */
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const m = getMessages(locale);
  return renderOgImage({
    brand: brandName(locale),
    tagline: m.site.tagline,
    eyebrow: m.og.homeEyebrow,
    title: m.og.homeTitle,
    subtitle: m.og.homeSubtitle,
  });
}
