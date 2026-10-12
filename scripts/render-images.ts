/**
 * 그림 검증용: 자격증의 assets/*.svg 를 PNG 로 바꾼다 (docs/data-rules.md 8장 "검증").
 *   npm run images:render -- {slug}            → reports/images-png/{slug}/*.png
 *   npm run images:render -- {slug} {파일 이름}  → 그 그림만
 *
 * 설치된 Chromium 을 명령줄로 직접 띄운다 (npm 패키지를 따로 설치하지 않는다).
 * Chromium 위치는 CHROMIUM_PATH, 없으면 /opt/pw-browsers 아래에서 찾는다.
 * PNG 는 검증하는 에이전트가 눈으로 보기 위한 임시 파일이다 (reports/images-png 는 git 에 올리지 않는다).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getCertSummary } from "../lib/data";
import { DATA_ROOT } from "../lib/data/fs-store";
import { assetsDir } from "../lib/data/paths";

function findChromium(): string | null {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const root = "/opt/pw-browsers";
  if (!fs.existsSync(root)) return null;
  for (const dir of fs.readdirSync(root).sort().reverse()) {
    for (const bin of ["chrome-linux/chrome", "chrome-linux64/chrome"]) {
      const file = path.join(root, dir, bin);
      if (dir.startsWith("chromium") && fs.existsSync(file)) return file;
    }
  }
  return null;
}

/** viewBox 의 폭·높이 (없으면 기본값) */
function sizeOf(svg: string): { w: number; h: number } {
  const m = svg.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  return m ? { w: Math.ceil(Number(m[1])), h: Math.ceil(Number(m[2])) } : { w: 600, h: 400 };
}

async function main(): Promise<void> {
  const [slug, only] = process.argv.slice(2);
  if (!slug) {
    console.error("사용법: npm run images:render -- {slug} [그림 파일 이름]");
    process.exit(1);
  }
  const cert = await getCertSummary(slug);
  if (!cert) {
    console.error(`자격증을 찾을 수 없습니다: ${slug}`);
    process.exit(1);
  }
  const chromium = findChromium();
  if (!chromium) {
    console.error("Chromium 을 찾지 못했습니다. 그림을 눈으로 검증할 수 없으므로 그림 문제·개념 그림은 게시하지 않습니다.");
    process.exit(1);
  }
  const dir = path.join(DATA_ROOT, ...assetsDir(cert.country, cert.id).split("/"));
  const names = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith(".svg") && (!only || n === only)) : [];
  if (names.length === 0) {
    console.error(`그림이 없습니다: ${dir}${only ? `/${only}` : ""}`);
    process.exit(1);
  }
  const out = path.join(process.cwd(), "reports", "images-png", cert.id);
  fs.mkdirSync(out, { recursive: true });
  for (const name of names) {
    const file = path.join(dir, name);
    const { w, h } = sizeOf(fs.readFileSync(file, "utf8"));
    const png = path.join(out, name.replace(/\.svg$/, ".png"));
    execFileSync(
      chromium,
      [
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--default-background-color=ffffffff",
        "--force-device-scale-factor=2",
        // 헤드리스 창은 요청한 높이보다 조금 작게 그려지므로 아래쪽이 잘리지 않게 여유를 둔다
        `--window-size=${w},${h + 120}`,
        `--screenshot=${png}`,
        `file://${file}`,
      ],
      { stdio: "ignore", timeout: 60_000 },
    );
    console.log(png);
  }
  console.log(`✓ ${names.length}장 → ${out}`);
}

void main();
