import { getGuide } from "@/lib/data";
import { brandName, DEFAULT_LOCALE, getMessages, isLocale } from "@/lib/i18n";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { guideParams } from "@/lib/static-params";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// 글마다 썸네일을 빌드 때 미리 만든다 (배포된 서버에서는 글꼴을 읽을 수 없어 그리지 못한다).
// 글 파일이 없는 주소는 만들지 않는다.
export const dynamicParams = false;
export const generateStaticParams = guideParams;

/**
 * 수험 정보 글 썸네일 (네이버·구글 검색, 카톡 공유 미리보기). 글 맨 위에도 같은 그림을 보여 준다.
 * 루틴은 글 파일만 쓰면 되고, 그림은 글 제목으로 자동으로 그려진다.
 * 이 파일은 일부러 (site) 묶음 밖에 둔다 (lib/seo.ts 의 certOgImagePath 설명과 같은 이유).
 */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const m = getMessages(locale);
  const guide = await getGuide(locale, slug);
  const common = { brand: brandName(locale), tagline: m.site.tagline, eyebrow: m.guide.listTitle };
  if (!guide) return renderOgImage({ ...common, title: m.guide.listTitle });
  return renderOgImage({ ...common, title: guide.title, subtitle: m.guide.categories[guide.category] });
}
