import { calcStars } from "./scoring";
import type { Question, Subject } from "./types";

/**
 * 검색엔진이 읽을 수 있도록 서버에서 HTML 로 그려 주는 "대표 문제" 고르기.
 * 빌드할 때마다 같은 결과가 나오도록 무작위를 쓰지 않는다.
 */

export const REPRESENTATIVE_COUNT = 10;

const LEVEL_ORDER = { basic: 0, intermediate: 1, advanced: 2 } as const;

function importanceMap(subjects: Subject[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of subjects) for (const c of s.chapters) map.set(c.id, c.importance);
  return map;
}

/** 기출 먼저 → 중요도 ★ 높은 순 → 출제 빈도 높은 순 → 쉬운 순 */
function byPriority(importance: Map<string, number>) {
  const stars = (q: Question) => calcStars(importance.get(q.chapterId) ?? 3, q.frequency);
  return (a: Question, b: Question) =>
    Number(b.source === "past") - Number(a.source === "past") ||
    stars(b) - stars(a) ||
    b.frequency - a.frequency ||
    LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
    a.id.localeCompare(b.id);
}

/**
 * 자격증 전체의 대표 문제: 과목을 돌아가며 한 문제씩 뽑아 과목이 고르게 섞이게 한다.
 * 같은 단원이 연달아 나오지 않도록 단원당 최대 2문제까지만 넣는다.
 */
export function pickCertRepresentatives(
  subjects: Subject[],
  questions: Question[],
  limit = REPRESENTATIVE_COUNT,
): Question[] {
  const sort = byPriority(importanceMap(subjects));
  const queues = subjects.map((s) => questions.filter((q) => q.subjectId === s.id).sort(sort));
  const perChapter = new Map<string, number>();
  const result: Question[] = [];

  let progressed = true;
  while (result.length < limit && progressed) {
    progressed = false;
    for (const queue of queues) {
      while (queue.length > 0) {
        const q = queue.shift()!;
        const used = perChapter.get(q.chapterId) ?? 0;
        if (used >= 2) continue;
        perChapter.set(q.chapterId, used + 1);
        result.push(q);
        progressed = true;
        break;
      }
      if (result.length >= limit) break;
    }
  }
  return result;
}

/** 단원의 대표 문제 */
export function pickChapterRepresentatives(
  subjects: Subject[],
  questions: Question[],
  chapterId: string,
  limit = REPRESENTATIVE_COUNT,
): Question[] {
  return questions
    .filter((q) => q.chapterId === chapterId)
    .sort(byPriority(importanceMap(subjects)))
    .slice(0, limit);
}
