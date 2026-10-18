import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** OG 이미지(카톡·밴드 공유 미리보기) 공통 틀 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// 글꼴은 처음 그릴 때 한 번만 읽는다.
// (이미지는 빌드 때 미리 만들어지므로, 배포된 서버에서는 이 파일을 읽을 일이 없다.
//  파일을 불러오기만 해도 읽으려 들면 서버에서 오류가 나므로 그릴 때까지 미룬다)
let fonts: Promise<[Buffer, Buffer]> | null = null;

function loadFonts(): Promise<[Buffer, Buffer]> {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Pretendard-Bold.otf")),
    readFile(join(process.cwd(), "assets/fonts/Pretendard-Regular.otf")),
  ]);
  return fonts;
}

// 브랜드 주황 (app/tokens.css 의 --primary, --primary-soft 와 같은 값). 흰 글자 대비 5.2:1
const BRAND = "#c2410c";
const BRAND_SOFT = "#fff1e6";
const ON_BRAND = "#ffffff";

/** 제목 길이에 맞춘 글자 크기 (수험 정보 글 제목은 60자까지라 여러 줄로 내려간다) */
function titleFontSize(title: string): number {
  const n = title.length;
  if (n <= 9) return 116;
  if (n <= 14) return 96;
  if (n <= 24) return 76;
  if (n <= 40) return 64;
  return 56;
}

/** 로고 마크 (components/LogoMark.tsx 와 같은 모양). 주황 바탕 위라 색을 뒤집어 흰 네모 안에 주황 달을 그린다 */
function OgLogo({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <rect width="64" height="64" rx="14" fill={ON_BRAND} />
      <circle cx="29" cy="34" r="19" fill={BRAND} />
      <circle cx="37" cy="27" r="15" fill={ON_BRAND} />
      <path
        d="M24 35 L31 42 L52 15"
        fill="none"
        stroke={BRAND}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 공유·검색 썸네일 (1200×630). 홈·자격증·수험 정보 글이 같은 틀을 쓴다.
 * 주황 바탕 · 왼쪽 위 로고와 사이트 이름 · 오른쪽 위 분류 꼬리표 · 가운데 큰 제목 · 아래 한 줄 소개.
 */
export async function renderOgImage({
  brand,
  tagline,
  eyebrow,
  title,
  subtitle,
}: {
  /** 사이트 이름과 한 줄 소개 (언어별로 다르다) */
  brand: string;
  tagline: string;
  eyebrow: string;
  title: string;
  /** 제목 아래 작은 줄 (없으면 생략) */
  subtitle?: string;
}): Promise<ImageResponse> {
  const [bold, regular] = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BRAND,
          color: ON_BRAND,
          padding: "60px 72px",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <OgLogo size={68} />
            <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginLeft: 20 }}>{brand}</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              background: BRAND_SOFT,
              color: BRAND,
              padding: "8px 24px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: titleFontSize(title), fontWeight: 700, lineHeight: 1.2, wordBreak: "keep-all" }}>
            {title}
          </div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 40, marginTop: 20, fontWeight: 400 }}>{subtitle}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", fontSize: 32, fontWeight: 400 }}>{tagline}</div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Pretendard", data: bold, style: "normal", weight: 700 },
        { name: "Pretendard", data: regular, style: "normal", weight: 400 },
      ],
    },
  );
}
