import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "./site";

/** OG 이미지(카톡·밴드 공유 미리보기) 공통 틀 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// 글꼴은 요청마다 달라지지 않으므로 모듈에서 한 번만 읽는다
const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Pretendard-Bold.otf")),
  readFile(join(process.cwd(), "assets/fonts/Pretendard-Regular.otf")),
]);

export async function renderOgImage({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}): Promise<ImageResponse> {
  const [bold, regular] = await fonts;
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
          background: "#1d4ed8",
          color: "#ffffff",
          padding: "64px 72px",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>{SITE_NAME}</div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              background: "#ffffff",
              color: "#1d4ed8",
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

        <div style={{ display: "flex", fontSize: 32, fontWeight: 400 }}>{SITE_TAGLINE}</div>
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
