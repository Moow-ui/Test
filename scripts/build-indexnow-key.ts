/**
 * public/{키}.txt 를 만든다 (IndexNow 키 확인 파일, 주소는 /{키}.txt).
 *   npm run build:indexnow   (dev·build 앞에서 자동 실행)
 *
 * 키는 config/indexnow.ts 한 곳에서 관리한다. 매번 새로 만들므로 git 에 올리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { INDEXNOW_KEY } from "../config/indexnow";

if (!/^[a-zA-Z0-9-]{8,128}$/.test(INDEXNOW_KEY)) {
  console.error(`[build-indexnow-key] config/indexnow.ts 의 키 형식이 올바르지 않습니다 (8~128자, 영문·숫자·-)`);
  process.exit(1);
}

const OUT_FILE = path.join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`);
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, INDEXNOW_KEY);
console.log(`[build-indexnow-key] → public/${INDEXNOW_KEY}.txt`);
