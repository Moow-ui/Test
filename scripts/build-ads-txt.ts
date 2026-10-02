/**
 * public/ads.txt 를 만든다 (주소는 /ads.txt).
 *   npm run build:ads   (dev·build 앞에서 자동 실행)
 *
 * NEXT_PUBLIC_ADSENSE_ID 가 있으면 애드센스가 요구하는 한 줄을 쓰고, 없으면 빈 파일로 둔다.
 * 매번 새로 만들므로 git 에 올리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { adsensePublisherNumber } from "../lib/site";

const OUT_FILE = path.join(process.cwd(), "public", "ads.txt");

const raw = process.env.NEXT_PUBLIC_ADSENSE_ID;
const publisher = adsensePublisherNumber(raw);
if (raw?.trim() && !publisher) {
  console.error(`[build-ads-txt] NEXT_PUBLIC_ADSENSE_ID 값이 올바르지 않습니다: "${raw}" (예: ca-pub-1234567890123456)`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, publisher ? `google.com, pub-${publisher}, DIRECT, f08c47fec0942fa0\n` : "");
console.log(`[build-ads-txt] ${publisher ? `pub-${publisher}` : "광고 id 없음 → 빈 파일"} → public/ads.txt`);
