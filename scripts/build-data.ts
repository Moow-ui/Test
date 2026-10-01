/**
 * 문제 데이터를 정적 파일로 내보낸다: data/ → public/data/ (주소는 /data/…)
 *   npm run build:data   (dev·build 앞에서 자동 실행)
 *
 * 문제를 Worker 코드 묶음에 넣지 않기 위해서다 (Worker 는 코드 크기 제한이 있다).
 * 브라우저는 자격증의 문제 목록(pool.json)을 먼저 받고, 필요한 단원 파일만 받는다 (lib/data/client.ts).
 * public/data 는 매번 새로 만들므로 git 에 올리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { getCertList, getQuestionFiles, getQuestionPool } from "../lib/data";
import { copyDataFile, fsStore } from "../lib/data/fs-store";
import { PUBLIC_DATA_DIR, assetsDir, publicAssetPath, publicPoolPath, publicQuestionsPath } from "../lib/data/paths";

const OUT_DIR = path.join(process.cwd(), ...PUBLIC_DATA_DIR.split("/"));

function write(relative: string, value: unknown): void {
  const file = path.join(OUT_DIR, ...relative.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

async function main(): Promise<void> {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  let certs = 0;
  let files = 0;

  for (const cert of await getCertList()) {
    if (!cert.ready) continue;
    certs += 1;
    write(publicPoolPath(cert.id), await getQuestionPool(cert.id));
    for (const file of await getQuestionFiles(cert.id)) {
      write(publicQuestionsPath(cert.id, file.stem), file.questions);
      files += 1;
    }
    for (const name of await fsStore.list(assetsDir(cert.country, cert.id))) {
      copyDataFile(
        `${assetsDir(cert.country, cert.id)}/${name}`,
        path.join(OUT_DIR, ...publicAssetPath(cert.id, name).split("/")),
      );
    }
  }
  console.log(`[build-data] 자격증 ${certs}종, 문제 파일 ${files}개 → ${PUBLIC_DATA_DIR}`);
}

void main();
