// Cloudflare(Workers Builds)에서 설치가 끝난 직후 사이트를 빌드한다.
//
// 이유: Cloudflare 의 배포 명령 `npx wrangler deploy` 는 OpenNext 프로젝트를 발견하면
// 곧바로 `opennextjs-cloudflare deploy` 를 부르는데, 이 명령은 "이미 빌드된 결과(.open-next)"가
// 있어야 한다. Build command 가 비어 있으면 빌드가 한 번도 실행되지 않아
// "Could not find compiled Open Next config" 오류로 배포가 실패한다.
//
// 내 컴퓨터에서 `npm install` 할 때는 아무것도 하지 않는다 (WORKERS_CI 는 Cloudflare 빌드 환경에만 있다).
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!process.env.WORKERS_CI) process.exit(0);
if (existsSync(".open-next/worker.js")) process.exit(0);

console.log("[ci-build] Cloudflare 빌드 환경: opennextjs-cloudflare build 실행");
execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
