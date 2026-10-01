/**
 * /data 폴더 전체 검증.
 *   npm run validate
 * 빌드 전에 자동으로 실행된다 (package.json 의 prebuild). 오류가 있으면 빌드·배포가 중단된다.
 * 검사 내용은 lib/data/validate.ts.
 */
import { z } from "zod";
import { fsStore } from "../lib/data/fs-store";
import { validateData } from "../lib/data/validate";

z.config(z.locales.ko());

async function main(): Promise<void> {
  const { errors, lines, certCount, questionCount } = await validateData(fsStore);
  console.log(`자격증 ${certCount}종 · 문제 ${questionCount}개`);
  for (const line of lines) console.log(line);

  if (errors.length > 0) {
    console.error(`\n오류 ${errors.length}건`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }
  console.log("\n데이터 검증 통과 ✓");
}

void main();
