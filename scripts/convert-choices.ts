/**
 * 기존 문제를 "난이도별 선지 수" 구조로 바꾼다 (초급 2개 · 중급 3개 · 고급 4개).
 *
 *   npm run choices:convert -- [옵션]
 *
 * 문제마다 둘 중 하나를 적는다 (규칙: lib/choice-reduce.ts, 뜻: docs/data-rules.md)
 *   choicesByLevel  난이도별로 남길 선지 번호 (정답 + 가장 그럴듯한 오답)
 *   levelLock       선지를 줄이면 뜻이 깨지는 문제 ("옳지 않은 것은?" 등). 초급·중급에서 제외
 *
 * 옵션
 *   --picks <파일.json>  사람이 정한 값. { "문제 id": [오답 번호를 그럴듯한 순서로] 또는 "lock" 또는 "open" }
 *                        "open" 은 자동 판단이 잠갔지만 줄여도 되는 문제 (오답 순서는 자동)
 *   --force              이미 값이 있는 문제도 다시 계산한다 (기본: 값이 없는 문제만)
 *   --dry-run            파일을 쓰지 않고 결과만 보여 준다
 *   --list               문제마다 한 줄씩 결과를 보여 준다 (검토용)
 *
 * 문제 id·내용은 바꾸지 않는다 (출제 방식만 바뀌므로 version 도 올리지 않는다).
 * 결과 요약은 reports/{YYYY-MM}/ 에 남긴다.
 */
import fs from "node:fs";
import path from "node:path";
import { detectLevelLock, reduceChoices } from "../lib/choice-reduce";
import { fsStore, writeDataJson } from "../lib/data/fs-store";
import { countryDir, metaFile, questionsDir } from "../lib/data/paths";
import { COUNTRIES, LEVELS, certMetaSchema } from "../lib/schemas";
import type { Question } from "../lib/types";

type Choice = number[] | "lock" | "open";
/** 파일에 적힌 그대로의 문제 (변환 전에는 새 스키마를 통과하지 못하므로 필요한 필드만 본다) */
type Raw = Record<string, unknown> & Pick<Question, "id" | "stem" | "choices" | "answer" | "explanation" | "level">;

const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const picksArg = argv.indexOf("--picks");
const picks: Record<string, Choice> =
  picksArg >= 0 ? (JSON.parse(fs.readFileSync(path.resolve(argv[picksArg + 1]), "utf8")) as Record<string, Choice>) : {};

/** 새 값은 tags·image 뒤, version·retired 앞에 둔다 (lib/schemas.ts 의 순서) */
function withReduced(raw: Raw, reduced: ReturnType<typeof reduceChoices>): Raw {
  const { version, retired, ...rest } = raw;
  delete rest.choicesByLevel;
  delete rest.levelLock;
  return {
    ...rest,
    ...reduced,
    ...(version !== undefined ? { version } : {}),
    ...(retired !== undefined ? { retired } : {}),
  } as Raw;
}

async function main(): Promise<void> {
  const summary: Array<Record<string, unknown>> = [];
  const locked: Array<{ id: string; reason: string; stem: string }> = [];
  const total = { questions: 0, converted: 0, reduced: 0, locked: 0, skipped: 0, byPick: 0 };
  const usedPicks = new Set<string>();

  // 변환 전의 문제는 새 스키마를 통과하지 못하므로 lib/data 의 읽기 함수 대신 파일을 그대로 읽는다
  const certs = [];
  for (const country of COUNTRIES) {
    for (const slug of await fsStore.list(countryDir(country))) {
      certs.push(certMetaSchema.parse(await fsStore.readJson(metaFile(country, slug))));
    }
  }

  for (const cert of certs) {
    if (!cert.examInfo) continue;
    const dir = questionsDir(cert.country, cert.id);
    if ((await fsStore.list(dir)).length === 0) continue;
    const row = { cert: cert.id, name: cert.name, questions: 0, reduced: 0, locked: 0, skipped: 0 };
    const usable: Record<string, number> = Object.fromEntries(LEVELS.map((l) => [l, 0]));

    for (const name of await fsStore.list(dir)) {
      if (!name.endsWith(".json")) continue;
      const file = `${dir}/${name}`;
      const list = (await fsStore.readJson(file)) as Raw[];
      let changed = false;

      const next = list.map((raw) => {
        row.questions += 1;
        const done = raw.choicesByLevel !== undefined || raw.levelLock === true;
        if (done && !flag("--force")) {
          row.skipped += 1;
          if (raw.levelLock === true) row.locked += 1;
          else row.reduced += 1;
          return raw;
        }
        const pick = picks[raw.id];
        if (pick !== undefined) usedPicks.add(raw.id);
        const reduced = reduceChoices(
          raw,
          Array.isArray(pick) ? pick : [],
          pick === "lock" ? true : pick === undefined ? undefined : false,
        );
        if (pick !== undefined) total.byPick += 1;
        if (reduced.levelLock) {
          row.locked += 1;
          locked.push({
            id: raw.id,
            reason: pick === "lock" ? "사람이 정함" : (detectLevelLock(raw) ?? ""),
            stem: raw.stem,
          });
        } else {
          row.reduced += 1;
        }
        if (flag("--list")) {
          const keep = reduced.choicesByLevel;
          const mark = (n: number) =>
            n === raw.answer ? "◎" : keep?.basic?.includes(n) ? "①" : keep?.intermediate?.includes(n) ? "②" : "·";
          console.log(
            `${raw.id} [${raw.level}]${reduced.levelLock ? " 🔒" : ""} ${raw.stem.replace(/\s+/g, " ")}\n   ` +
              raw.choices.map((c, i) => `${mark(i + 1)}${i + 1}) ${c}`).join("  "),
          );
        }
        changed = true;
        total.converted += 1;
        return withReduced(raw, reduced);
      });

      for (const raw of next) {
        if (raw.retired === true) continue;
        // 난이도 카드에 나올 수 있는 문제 수 (초급·중급은 levelLock 제외, lib/quiz-engine.ts 의 LEVEL_RULES)
        if (raw.level === "basic" && raw.levelLock !== true) usable.basic += 1;
        if (raw.level !== "advanced" && raw.levelLock !== true) usable.intermediate += 1;
        if (raw.level !== "basic") usable.advanced += 1;
      }
      if (changed && !flag("--dry-run")) writeDataJson(file, next);
    }

    total.questions += row.questions;
    total.reduced += row.reduced;
    total.locked += row.locked;
    total.skipped += row.skipped;
    summary.push({ ...row, choiceCount: cert.examInfo.choiceCount, usable });
  }

  const unknownPicks = Object.keys(picks).filter((id) => !usedPicks.has(id));

  console.log("\n[난이도별 선지 수 변환]\n");
  console.log("자격증                              문제  줄임  잠금   초급/중급/고급에 나오는 문제");
  for (const r of summary) {
    const u = r.usable as Record<string, number>;
    console.log(
      `${String(r.cert).padEnd(34)} ${String(r.questions).padStart(4)}  ${String(r.reduced).padStart(4)}  ${String(r.locked).padStart(4)}   ${u.basic} / ${u.intermediate} / ${u.advanced}`,
    );
  }
  console.log(
    `\n합계: 문제 ${total.questions}개 → 선지 줄임(choicesByLevel) ${total.reduced}개, 잠금(levelLock) ${total.locked}개` +
      ` (이번에 바꾼 문제 ${total.converted}개, 이미 되어 있던 문제 ${total.skipped}개, 사람이 정한 값 ${total.byPick}개)`,
  );
  if (unknownPicks.length > 0) console.log(`\n⚠ --picks 에 없는 문제 id 가 있습니다: ${unknownPicks.join(", ")}`);

  if (flag("--dry-run")) {
    console.log("\n(--dry-run) 파일은 바뀌지 않았습니다.\n");
    return;
  }
  if (total.converted === 0) {
    console.log("\n바꿀 문제가 없습니다.\n");
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const report = path.join(process.cwd(), "reports", stamp.slice(0, 7), `convert-choices-${stamp}.json`);
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(report, JSON.stringify({ total, certs: summary, locked, picks }, null, 2));
  console.log(`\n리포트: ${path.relative(process.cwd(), report).split(path.sep).join("/")}`);
  console.log("다음 순서: npm run validate → npm test\n");
}

void main();
