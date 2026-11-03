/**
 * 자격증 페이지 고유 내용 검사 (구글이 "이름만 바꾼 비슷한 페이지"로 보지 않게. docs/refine.md).
 *
 * 1. 단원 핵심정리 요점(keyPoints)과 개념 정리 본문이 같은 문장을 쓰지 않는다 (한 단원에 두 페이지가 같은 말을 하지 않게)
 * 2. 같은 나라 다른 자격증과 똑같은 문장(자격증 이름만 바꾼 문장 포함)을 많이 쓰지 않는다
 * 3. 단원 핵심정리 페이지마다 그 단원만의 글(소개·요점·함정)이 충분히 있다
 * 4. 단원의 절반 이상에 "자주 틀리는 함정"이 있다
 *
 * 내용 다듬기를 마친 자격증(meta.refinedAt)과 2026-11-04 이후 추가된 자격증은 오류, 나머지는 경고(개수만)로 센다.
 * 경고는 빌드를 막지 않는다 (아직 다듬지 않은 자격증 때문에 다른 루틴이 멈추지 않게).
 */

/** 이 날부터 추가된 자격증은 처음부터 다듬은 방식으로 만든다 */
export const REFINE_START = "2026-11-04";

/** 두 문장이 이 값 이상 비슷하면 같은 문장으로 본다 (글자 4개 묶음의 자카드 유사도) */
export const SAME_SENTENCE_SIMILARITY = 0.6;
/** 다른 자격증과 똑같은 문장의 비율 상한 (그 자격증 문장 수 대비) */
export const MAX_SHARED_RATIO = 0.05;
/** 단원 핵심정리 페이지의 고유 글 최소 길이 (공백 뺀 글자 수). 한국어·영어 글자 밀도가 달라 따로 둔다 */
export const MIN_CHAPTER_CHARS = { KR: 300, US: 600 } as const;
/** 함정이 있어야 하는 단원 비율 */
export const MIN_PITFALL_CHAPTER_RATIO = 0.5;

export interface ChapterText {
  id: string;
  summary: string;
  keyPoints: string[];
  pitfalls?: Array<{ trap: string; fact: string }>;
  /** 개념 정리 단원 페이지의 글 (concepts.json 의 summary·카드 정의·포인트). 검증 통과(verifiedAt) 단원만. 없으면 그 페이지가 없는 단원 */
  conceptText?: string[];
}

export interface CertText {
  id: string;
  country: "KR" | "US";
  /** 자격증 이름·줄임말 (문장 비교 때 지운다: 이름만 바꾼 문장을 같은 문장으로 잡기 위해) */
  names: string[];
  chapters: ChapterText[];
}

export interface ContentReport {
  problems: string[];
  /** 문장 수 */
  sentences: number;
  /** 다른 자격증과 똑같은 문장 수 */
  shared: number;
  /** 요점과 개념 정리가 겹치는 문장 수 */
  internal: number;
  /** 고유 글이 모자란 단원 수 */
  thin: number;
  /** 함정이 있는 단원 수 / 전체 단원 수 */
  pitfallChapters: number;
  chapters: number;
}

/** 문장으로 나누기 (마침표·물음표·느낌표·줄바꿈 기준) */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。])\s+|\n+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** 비교용 문장: 자격증 이름을 지우고, 공백·문장부호·숫자를 뺀 소문자 */
export function normalizeSentence(sentence: string, names: string[] = []): string {
  let s = sentence.toLowerCase();
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    if (name.length >= 2) s = s.split(name.toLowerCase()).join("§");
  }
  return s.replace(/[\s\p{P}\p{S}\d]+/gu, "");
}

function shingles(text: string, size = 4): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i + size <= text.length; i++) set.add(text.slice(i, i + size));
  return set;
}

/** 두 문장의 겹침 정도 (0~1) */
export function sentenceSimilarity(a: string, b: string): number {
  const sa = shingles(normalizeSentence(a));
  const sb = shingles(normalizeSentence(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let common = 0;
  for (const s of sa) if (sb.has(s)) common++;
  return common / (sa.size + sb.size - common);
}

/** 짧은 문장(용어 하나 등)은 다른 자격증과 같아도 문제 삼지 않는다 */
const MIN_COMPARE_LENGTH = { KR: 15, US: 30 } as const;

/** 자격증 하나의 모든 문장 (비교용으로 정규화). 다른 자격증과 비교할 때 쓴다 */
export function certSentenceKeys(cert: CertText): Set<string> {
  const keys = new Set<string>();
  for (const s of allSentences(cert)) {
    const key = normalizeSentence(s, cert.names);
    if (key.length >= MIN_COMPARE_LENGTH[cert.country]) keys.add(key);
  }
  return keys;
}

function chapterSentences(ch: ChapterText): string[] {
  return [
    ...splitSentences(ch.summary),
    ...ch.keyPoints.flatMap(splitSentences),
    ...(ch.pitfalls ?? []).flatMap((p) => [...splitSentences(p.trap), ...splitSentences(p.fact)]),
    ...(ch.conceptText ?? []).flatMap(splitSentences),
  ];
}

function allSentences(cert: CertText): string[] {
  return cert.chapters.flatMap(chapterSentences);
}

/**
 * 자격증 하나 검사. others = 같은 나라 다른 자격증들의 문장 키 (certSentenceKeys).
 * problems 는 사람이 읽는 문장. 오류로 쓸지 경고로 쓸지는 부르는 쪽이 정한다.
 */
export function checkCertContent(cert: CertText, others: Map<string, Set<string>>): ContentReport {
  const problems: string[] = [];
  let internal = 0;
  let thin = 0;
  let pitfallChapters = 0;

  for (const ch of cert.chapters) {
    // 1. 요점 ↔ 개념 정리 본문
    const concept = (ch.conceptText ?? []).flatMap(splitSentences);
    for (const point of ch.keyPoints.flatMap(splitSentences)) {
      const twin = concept.find((c) => sentenceSimilarity(point, c) >= SAME_SENTENCE_SIMILARITY);
      if (twin) {
        internal++;
        problems.push(`단원 ${ch.id}: 핵심정리 요점과 개념 정리 본문에 같은 문장 — "${point.slice(0, 40)}…"`);
      }
    }
    // 3. 단원 핵심정리 페이지의 고유 글 길이 (소개·요점·함정)
    const own = [ch.summary, ...ch.keyPoints, ...(ch.pitfalls ?? []).flatMap((p) => [p.trap, p.fact])]
      .join("")
      .replace(/\s/g, "").length;
    if (own < MIN_CHAPTER_CHARS[cert.country]) {
      thin++;
      problems.push(`단원 ${ch.id}: 단원만의 글이 짧다 (${own}자 / 기준 ${MIN_CHAPTER_CHARS[cert.country]}자 이상)`);
    }
    if ((ch.pitfalls ?? []).length > 0) pitfallChapters++;
  }

  // 2. 다른 자격증과 똑같은 문장
  const sentences = allSentences(cert);
  let shared = 0;
  const sharedWith = new Map<string, number>();
  for (const key of certSentenceKeys(cert)) {
    for (const [otherId, keys] of others) {
      if (otherId !== cert.id && keys.has(key)) {
        shared++;
        sharedWith.set(otherId, (sharedWith.get(otherId) ?? 0) + 1);
        break;
      }
    }
  }
  const total = Math.max(1, sentences.length);
  if (shared / total > MAX_SHARED_RATIO) {
    const top = [...sharedWith].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => `${id} ${n}`).join(", ");
    problems.push(
      `다른 자격증과 똑같은 문장이 많다 (${shared}/${sentences.length}, 기준 ${MAX_SHARED_RATIO * 100}% 이하. 많이 겹치는 곳: ${top})`,
    );
  }

  // 4. 함정
  if (cert.chapters.length > 0 && pitfallChapters / cert.chapters.length < MIN_PITFALL_CHAPTER_RATIO) {
    problems.push(
      `"자주 틀리는 함정"이 있는 단원이 적다 (${pitfallChapters}/${cert.chapters.length}, 절반 이상이어야 한다)`,
    );
  }

  return { problems, sentences: sentences.length, shared, internal, thin, pitfallChapters, chapters: cert.chapters.length };
}

/** 이 자격증에 고유 내용 검사를 오류로 적용하는가 */
export function mustPassContentCheck(meta: { refinedAt?: string; addedAt?: string }): boolean {
  return !!meta.refinedAt || (!!meta.addedAt && meta.addedAt >= REFINE_START);
}
