/**
 * 문제 데이터를 정적 파일로 내보낸다: data/ → public/data/ (주소는 /data/…)
 *   npm run build:data   (dev·build 앞에서 자동 실행)
 *
 * 문제를 Worker 코드 묶음에 넣지 않기 위해서다 (Worker 는 코드 크기 제한이 있다).
 * 브라우저는 자격증의 문제 목록(pool.json)을 먼저 받고, 문제 내용은 자격증 파일 하나(questions.json)로 받는다 (lib/data/client.ts).
 * 원본(data/certs/…/questions/{단원}.json)은 단원별 관리 그대로이고, 내보낼 때만 자격증마다 1개로 합친다
 * (Cloudflare 정적 파일 개수 제한 때문에 자격증당 배포 파일 수를 줄인다).
 * public/data 는 매번 새로 만들므로 git 에 올리지 않는다.
 */
import fs from "node:fs";
import path from "node:path";
import { buildDailySchedule, isDailyCandidate } from "../lib/daily";
import { getCertList, getQuestionFiles, getQuestionPool } from "../lib/data";
import { copyDataFile, fsStore } from "../lib/data/fs-store";
import {
  PUBLIC_CERT_IDS_PATH,
  PUBLIC_DATA_DIR,
  assetsDir,
  publicAssetPath,
  publicDailyPath,
  publicPoolPath,
  publicQuestionsPath,
} from "../lib/data/paths";

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

  const all = await getCertList();
  write(
    PUBLIC_CERT_IDS_PATH,
    all.map((cert) => cert.id),
  );

  // 홈 "오늘의 1문제" 후보 (나라별)
  const daily = new Map<string, Parameters<typeof buildDailySchedule>[0]>();

  for (const cert of all) {
    if (!cert.ready) continue;
    certs += 1;
    write(publicPoolPath(cert.id), await getQuestionPool(cert.id));
    const items: Array<{ id: string; file: string }> = [];
    const questions: unknown[] = [];
    for (const file of await getQuestionFiles(cert.id)) {
      questions.push(...file.questions);
      for (const q of file.questions) if (isDailyCandidate(q)) items.push({ id: q.id, file: file.stem });
    }
    write(publicQuestionsPath(cert.id), questions);
    files += 1;
    items.sort((a, b) => a.id.localeCompare(b.id));
    const list = daily.get(cert.country) ?? [];
    list.push({ certId: cert.id, certName: cert.name, items });
    daily.set(cert.country, list);
    for (const name of await fsStore.list(assetsDir(cert.country, cert.id))) {
      copyDataFile(
        `${assetsDir(cert.country, cert.id)}/${name}`,
        path.join(OUT_DIR, ...publicAssetPath(cert.id, name).split("/")),
      );
    }
  }
  for (const [country, candidates] of daily) write(publicDailyPath(country), buildDailySchedule(candidates));
  console.log(`[build-data] 자격증 ${certs}종, 문제 파일 ${files}개 → ${PUBLIC_DATA_DIR}`);
}

void main();
