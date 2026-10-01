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
  subtitle: string;
}): Promise<ImageResponse> {
  const [bold, regular] = await loadFonts();
  const titleSize = title.length > 14 ? 76 : title.length > 9 ? 96 : 116;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#17224f",
          color: "#ffffff",
          padding: "64px 72px",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{brand}</div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              background: "#ffffff",
              color: "#17224f",
              padding: "8px 24px",
              borderRadius: 999,
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.15 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 44, marginTop: 20, fontWeight: 400 }}>{subtitle}</div>
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
