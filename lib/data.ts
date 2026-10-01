import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DATA_DIR, certDetailFile, listQuestionFiles, readJsonFile } from "./data-files";
import { isWithinPastWindow } from "./past";
import { certDetailSchema, certSummarySchema, questionSchema } from "./schemas";
import type { CertDetail, CertListItem, CertSummary, Certification, Country, Question } from "./types";

/**
 * 데이터 접근 계층 (서버 전용).
 *
 * 지금은 /data 폴더의 JSON 파일을 읽지만, 나중에 Supabase 등으로 옮길 때는
 * 이 파일의 함수 내용만 바꾸면 되도록 화면 코드는 모두 여기 함수만 호출한다.
 * 그래서 함수는 처음부터 전부 async 로 만들어 두었다.
 *
 * 파일 위치 규칙은 lib/data-files.ts 참고.
 * 기출은 최근 10년치만 내보낸다 (lib/past.ts). 더 오래된 기출은 파일에 남아 있어도 사이트에 나오지 않는다.
 */

const useCache = process.env.NODE_ENV === "production";

const cache = new Map<string, unknown>();

function cached<T>(key: string, load: () => T): T {
  if (useCache && cache.has(key)) return cache.get(key) as T;
  const value = load();
  if (useCache) cache.set(key, value);
  return value;
}

const readJson = readJsonFile;

function loadSummaries(): CertSummary[] {
  return cached("summaries", () =>
    z.array(certSummarySchema).parse(readJson(path.join(DATA_DIR, "certifications.json"))),
  );
}

function loadDetail(id: string): CertDetail | null {
  return cached(`detail:${id}`, () => {
    const file = certDetailFile(id);
    if (!fs.existsSync(file)) return null;
    return certDetailSchema.parse(readJson(file));
  });
}

function loadQuestions(id: string): Question[] {
  return cached(`questions:${id}`, () => {
    const all: Question[] = [];
    for (const file of listQuestionFiles(id)) {
      all.push(...z.array(questionSchema).parse(readJson(file)));
    }
    // 최근 10년 안의 기출만 수록한다
    return all.filter((q) => q.source !== "past" || !q.pastInfo || isWithinPastWindow(q.pastInfo.year));
  });
}

function isReady(id: string): boolean {
  return loadDetail(id) !== null && loadQuestions(id).length > 0;
}

/** 자격증 목록 (노출 우선순위 순). country 를 넘기면 그 나라 자격증만 */
export async function getCertList(country?: Country): Promise<CertListItem[]> {
  return loadSummaries()
    .filter((s) => !country || s.country === country)
    .map((s) => ({ ...s, ready: isReady(s.id) }));
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

/** 그 나라의 자격증 한 건. 다른 나라 자격증이면 null (/en 에서 한국 자격증 주소를 열 수 없게) */
export async function getCertificationIn(country: Country, id: string): Promise<Certification | null> {
  const cert = await getCertification(id);
  return cert && cert.country === country ? cert : null;
}

/** 풀이가 가능한(문제가 준비된) 자격증만. country 를 넘기면 그 나라 자격증만 */
export async function getReadyCertifications(country?: Country): Promise<Certification[]> {
  const result: Certification[] = [];
  for (const s of loadSummaries()) {
    if (country && s.country !== country) continue;
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
