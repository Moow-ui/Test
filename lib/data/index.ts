import { z } from "zod";
import { isWithinPastWindow } from "../past";
import { COUNTRIES, certMetaSchema, certSummarySchema, chaptersFileSchema, questionSchema } from "../schemas";
import type {
  CertListItem,
  CertMeta,
  CertSummary,
  Certification,
  Country,
  PoolItem,
  Question,
  Subject,
} from "../types";
import { fsStore } from "./fs-store";
import { chaptersFile, countryDir, metaFile, questionsDir } from "./paths";
import type { DataStore } from "./store";

/**
 * 데이터 읽기 (서버·빌드 전용). 데이터를 읽는 코드는 lib/data/ 에만 둔다.
 *
 * 자격증 목록은 손으로 적지 않는다. data/certs/{country}/ 아래의 폴더가 곧 목록이다.
 * 화면 코드는 여기 함수만 부르고, 어디에 저장되어 있는지는 모른다 (lib/data/store.ts).
 * 브라우저에서 문제를 불러오는 코드는 lib/data/client.ts.
 */

/** 저장 방식을 바꿀 때는 이 한 줄만 바꾼다 (D1·R2 등) */
const store: DataStore = fsStore;

/**
 * 한 번 읽은 것은 다시 읽지 않는다 (자격증이 수백 개여도 빌드가 느려지지 않게).
 * 개발 서버에서는 data 파일을 고치면 곧 반영되도록 잠깐만 기억한다.
 */
const CACHE_MS = process.env.NODE_ENV === "production" ? Infinity : 2000;
const cache = new Map<string, { at: number; value: Promise<unknown> }>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
  const value = load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

interface LoadedCert {
  meta: CertMeta;
  /** chapters.json 이 없으면 null ("준비 중") */
  subjects: Subject[] | null;
}

function loadCerts(): Promise<LoadedCert[]> {
  return cached("certs", async () => {
    const result: LoadedCert[] = [];
    for (const country of COUNTRIES) {
      for (const slug of await store.list(countryDir(country))) {
        const meta = certMetaSchema.parse(await store.readJson(metaFile(country, slug)));
        const chapters = await store.readJson(chaptersFile(country, slug));
        result.push({ meta, subjects: chapters ? chaptersFileSchema.parse(chapters).subjects : null });
      }
    }
    return result;
  });
}

async function findCert(id: string): Promise<LoadedCert | null> {
  return (await loadCerts()).find((c) => c.meta.id === id) ?? null;
}

export interface QuestionFile {
  /** 파일 이름 (확장자 없이) */
  stem: string;
  questions: Question[];
}

/** 자격증의 문제 파일 전체 (출제 중단(retired) 문제 포함). 과목·단원 순서로 돌려준다 */
export function getQuestionFiles(certId: string): Promise<QuestionFile[]> {
  return cached(`files:${certId}`, async () => {
    const cert = await findCert(certId);
    if (!cert?.subjects) return [];
    const dir = questionsDir(cert.meta.country, cert.meta.id);
    const files: QuestionFile[] = [];
    for (const name of await store.list(dir)) {
      if (!name.endsWith(".json")) continue;
      const questions = z.array(questionSchema).parse(await store.readJson(`${dir}/${name}`));
      files.push({ stem: name.replace(/\.json$/, ""), questions });
    }
    const chapterOrder = cert.subjects.flatMap((s) => s.chapters.map((c) => c.id));
    const orderOf = (f: QuestionFile) => chapterOrder.indexOf(f.questions[0]?.chapterId ?? "");
    return files.sort((a, b) => orderOf(a) - orderOf(b));
  });
}

/** 지금 출제되는 문제인가: 출제 중단이 아니고, 기출이면 최근 10년 안 (lib/past.ts) */
function isActive(q: Question): boolean {
  return !q.retired && (q.source !== "past" || !q.pastInfo || isWithinPastWindow(q.pastInfo.year));
}

/** 자격증의 전체 문제 (지금 출제되는 것만) */
export async function getQuestions(certId: string): Promise<Question[]> {
  return (await getQuestionFiles(certId)).flatMap((f) => f.questions).filter(isActive);
}

/**
 * 문제 목록 (뽑기에 필요한 값만). 브라우저는 이것으로 문제를 뽑은 뒤 필요한 단원 파일만 받는다.
 * 출제 중단 문제도 들어 있다 (오답노트에 남아 있는 문제를 찾을 수 있게). 기간이 지난 기출은 뺀다.
 */
export async function getQuestionPool(certId: string): Promise<PoolItem[]> {
  return (await getQuestionFiles(certId)).flatMap((f) =>
    f.questions
      .filter((q) => q.retired || isActive(q))
      .map((q) => ({
        id: q.id,
        subjectId: q.subjectId,
        chapterId: q.chapterId,
        level: q.level,
        source: q.source,
        levelLock: q.levelLock,
        retired: q.retired,
        file: f.stem,
      })),
  );
}

async function toListItem(cert: LoadedCert): Promise<CertListItem> {
  const questionCount = (await getQuestions(cert.meta.id)).length;
  return {
    ...certSummarySchema.parse(cert.meta),
    questionCount,
    ready: !!cert.subjects && !!cert.meta.examInfo && questionCount > 0,
  };
}

/**
 * 자격증 요약 인덱스 (이름·분야·자격 종류·시행기관·문제 수). 홈 목록과 검색은 이것만 쓴다.
 * 순서: 문제가 준비된 자격증 먼저 → meta.json 의 order → id. country 를 넘기면 그 나라 자격증만.
 */
export async function getCertList(country?: Country): Promise<CertListItem[]> {
  const certs = (await loadCerts()).filter((c) => !country || c.meta.country === country);
  const order = new Map(certs.map((c) => [c.meta.id, c.meta.order]));
  const items = await Promise.all(certs.map(toListItem));
  return items.sort(
    (a, b) =>
      Number(b.ready) - Number(a.ready) ||
      (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0) ||
      a.id.localeCompare(b.id),
  );
}

/** 자격증 한 건 (없으면 null) */
export async function getCertification(id: string): Promise<Certification | null> {
  const cert = await findCert(id);
  if (!cert) return null;
  const item = await toListItem(cert);
  const hasDetail = !!cert.subjects && !!cert.meta.examInfo;
  return {
    ...certSummarySchema.parse(cert.meta),
    examInfo: hasDetail ? (cert.meta.examInfo ?? null) : null,
    subjects: hasDetail ? (cert.subjects ?? []) : [],
    content: hasDetail ? (cert.meta.content ?? null) : null,
    studyTips: cert.meta.studyTips ?? null,
    updatedAt: hasDetail ? (cert.meta.updatedAt ?? null) : null,
    ready: item.ready,
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
  for (const item of await getCertList(country)) {
    if (!item.ready) continue;
    const cert = await getCertification(item.id);
    if (cert) result.push(cert);
  }
  return result;
}

/** 이름만 빠르게 찾을 때 */
export async function getCertSummary(id: string): Promise<CertSummary | null> {
  const cert = await findCert(id);
  return cert ? certSummarySchema.parse(cert.meta) : null;
}
