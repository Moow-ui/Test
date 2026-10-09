/**
 * Cloudflare 배포 파일 수 검사 (루틴이 오늘 "추가 모드"인지 "보강 모드"인지 정한다).
 *   npm run build  →  npm run check:deploy-size
 *
 * Cloudflare Workers 는 배포 한 번에 올릴 수 있는 정적 파일 수에 한도가 있다 (무료 20,000 · 유료 100,000).
 * 배포 파일 = 미리 만든 페이지(.next/prerender-manifest.json 의 routes, 페이지마다 캐시 파일 1개)
 *           + public/ 파일 + .next/static/ 파일.
 * 한도는 docs/routine-status.md 의 "배포 파일 한도" 행에서 읽는다 (요금제를 바꾸면 그 값만 고친다).
 * 한도 - 1,000 개 이상이면 "보강 모드": 새 자격증을 추가하지 않고 기존 자격증의 문제를 보강한다 (docs/daily-routine.md 0-1).
 * 검사 결과와 상관없이 항상 0 으로 끝난다 (빌드·배포를 막지 않는다).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_LIMIT = 20_000;
const MARGIN = 1_000;

function countFiles(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? countFiles(path.join(dir, entry.name)) : 1;
  }
  return n;
}

function readLimit(): number {
  const file = path.join(ROOT, "docs", "routine-status.md");
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const match = /\|\s*배포 파일 한도\s*\|\s*([\d,]+)/.exec(text);
  return match ? Number(match[1].replace(/,/g, "")) : DEFAULT_LIMIT;
}

const manifestFile = path.join(ROOT, ".next", "prerender-manifest.json");
if (!fs.existsSync(manifestFile)) {
  console.error("빌드 결과(.next)가 없습니다. 먼저 `npm run build` 를 실행하세요.");
  process.exit(1);
}
const routes = Object.keys(JSON.parse(fs.readFileSync(manifestFile, "utf8")).routes ?? {}).length;
const total = routes + countFiles(path.join(ROOT, "public")) + countFiles(path.join(ROOT, ".next", "static"));
const limit = readLimit();
const threshold = limit - MARGIN;
const fmt = (n: number) => n.toLocaleString("en-US");

console.log(`배포 파일(예상) ${fmt(total)}개 / 한도 ${fmt(limit)}개 · 보강 모드 기준 ${fmt(threshold)}개`);
console.log(total >= threshold ? "모드: 보강 (새 자격증 추가 안 함)" : "모드: 추가");
