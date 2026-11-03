/**
 * 자격증 페이지 고유 내용 검사 결과 보기 (docs/refine.md).
 *   npm run check:unique              전체 요약 (자격증마다 한 줄)
 *   npm run check:unique -- {slug}    그 자격증의 문제 목록까지
 * 다듬은 자격증·새 자격증은 npm run validate 가 같은 검사를 오류로 적용한다. 이 명령은 보기만 한다.
 */
import { checkCertContent, certSentenceKeys, mustPassContentCheck } from "../lib/content-quality";
import { loadCertTexts } from "../lib/data/content-texts";
import { fsStore } from "../lib/data/fs-store";

async function main(): Promise<void> {
  const slug = process.argv[2];
  const entries = await loadCertTexts(fsStore);
  const keys = new Map(entries.map((e) => [e.text.id, certSentenceKeys(e.text)]));
  const targets = slug ? entries.filter((e) => e.text.id === slug) : entries;
  if (slug && targets.length === 0) {
    console.error(`${slug}: 문제가 있는 자격증이 아닙니다`);
    process.exit(1);
  }
  let failing = 0;
  console.log("자격증 | 다듬음 | 문장 | 다른 자격증과 같은 문장 | 요점↔개념 정리 겹침 | 글이 짧은 단원 | 함정 있는 단원 | 문제 수");
  for (const e of targets) {
    const sameCountry = new Map([...keys].filter(([id]) => entries.find((x) => x.text.id === id)?.text.country === e.text.country));
    const r = checkCertContent(e.text, sameCountry);
    const strict = mustPassContentCheck(e);
    if (strict && r.problems.length > 0) failing++;
    console.log(
      `${e.text.country} ${e.text.id} | ${e.refinedAt ?? (strict ? "새 자격증" : "-")} | ${r.sentences} | ${r.shared} | ${r.internal} | ${r.thin}/${r.chapters} | ${r.pitfallChapters}/${r.chapters} | ${r.problems.length}`,
    );
    if (slug) for (const p of r.problems) console.log(`  - ${p}`);
  }
  if (failing > 0) {
    console.error(`\n다듬은 자격증 가운데 기준에 못 미치는 것 ${failing}개 (npm run validate 가 막는다)`);
    process.exit(1);
  }
}

void main();
