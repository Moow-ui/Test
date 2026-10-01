import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { certDetailSchema, certSummarySchema, questionSchema } from "./schemas";
import type { CertDetail, CertListItem, CertSummary, Certification, Question } from "./types";

/**
 * 데이터 접근 계층 (서버 전용).
 *
 * 지금은 /data 폴더의 JSON 파일을 읽지만, 나중에 Supabase 등으로 옮길 때는
 * 이 파일의 함수 내용만 바꾸면 되도록 화면 코드는 모두 여기 함수만 호출한다.
 * 그래서 함수는 처음부터 전부 async 로 만들어 두었다.
 *
 *   data/certifications.json          자격증 목록 (노출 순서 = 배열 순서)
 *   data/certs/{id}.json              시험 정보·과목·단원·본문 (준비된 자격증만)
 *   data/questions/{id}/*.json        문제 (폴더 안 모든 json 파일을 합쳐 읽는다)
 */

const DATA_DIR = path.join(process.cwd(), "data");
const useCache = process.env.NODE_ENV === "production";

const cache = new Map<string, unknown>();

function cached<T>(key: string, load: () => T): T {
  if (useCache && cache.has(key)) return cache.get(key) as T;
  const value = load();
  if (useCache) cache.set(key, value);
  return value;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function loadSummaries(): CertSummary[] {
  return cached("summaries", () =>
    z.array(certSummarySchema).parse(readJson(path.join(DATA_DIR, "certifications.json"))),
  );
}

function loadDetail(id: string): CertDetail | null {
  return cached(`detail:${id}`, () => {
    const file = path.join(DATA_DIR, "certs", `${id}.json`);
    if (!fs.existsSync(file)) return null;
    return certDetailSchema.parse(readJson(file));
  });
}

function loadQuestions(id: string): Question[] {
  return cached(`questions:${id}`, () => {
    const dir = path.join(DATA_DIR, "questions", id);
    if (!fs.existsSync(dir)) return [];
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    const all: Question[] = [];
    for (const f of files) {
      all.push(...z.array(questionSchema).parse(readJson(path.join(dir, f))));
    }
    return all;
  });
}

function isReady(id: string): boolean {
  return loadDetail(id) !== null && loadQuestions(id).length > 0;
}

/** 자격증 목록 (노출 우선순위 순) */
export async function getCertList(): Promise<CertListItem[]> {
  return loadSummaries().map((s) => ({ ...s, ready: isReady(s.id) }));
}

/** 자격증 한 건 (없으면 null) */
export async function getCertification(id: string): Promise<Certification | null> {
  const summary = loadSummaries().find((s) => s.id === id);
  if (!summary) return null;
  const detail = loadDetail(id);
  return {
    ...summary,
    examInfo: detail?.examInfo ?? null,
    subjects: detail?.subjects ?? [],
    content: detail?.content ?? null,
    updatedAt: detail?.updatedAt ?? null,
    ready: isReady(id),
  };
}

/** 풀이가 가능한(문제가 준비된) 자격증만 */
export async function getReadyCertifications(): Promise<Certification[]> {
  const result: Certification[] = [];
  for (const s of loadSummaries()) {
    const cert = await getCertification(s.id);
    if (cert?.ready) result.push(cert);
  }
  return result;
}

/** 자격증의 전체 문제 */
export async function getQuestions(certId: string): Promise<Question[]> {
  return loadQuestions(certId);
}

/** 이름만 빠르게 찾을 때 */
export async function getCertSummary(id: string): Promise<CertSummary | null> {
  return loadSummaries().find((s) => s.id === id) ?? null;
}
