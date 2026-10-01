import type { CertDetail, CertSummary, Question } from "./types";

/**
 * 스키마(zod)만으로는 잡을 수 없는, 파일 사이의 관계를 검사한다.
 * lib/data/validate.ts, scripts/import-questions.ts, tests/data.test.ts 가 함께 쓴다.
 */

/** 문제 한 건이 자격증의 과목·단원과 맞는지 검사해 오류 문장을 돌려준다 */
export function checkQuestionRefs(q: Question, detail: CertDetail): string[] {
  const errors: string[] = [];
  if (q.certId !== detail.id) {
    errors.push(`certId 가 "${detail.id}" 가 아닙니다 (${q.certId})`);
  }
  const subject = detail.subjects.find((s) => s.id === q.subjectId);
  if (!subject) {
    errors.push(
      `과목 id "${q.subjectId}" 가 없습니다 (가능한 값: ${detail.subjects.map((s) => s.id).join(", ")})`,
    );
    return errors;
  }
  if (!subject.chapters.some((c) => c.id === q.chapterId)) {
    errors.push(
      `과목 "${subject.name}" 에 단원 id "${q.chapterId}" 가 없습니다 (가능한 값: ${subject.chapters
        .map((c) => c.id)
        .join(", ")})`,
    );
  }
  return errors;
}

/** 자격증 목록의 id 중복·관련 자격증 참조 검사 */
export function checkCertList(summaries: CertSummary[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const s of summaries) {
    if (ids.has(s.id)) errors.push(`자격증 id 중복: ${s.id}`);
    ids.add(s.id);
  }
  for (const s of summaries) {
    for (const related of s.relatedCertIds) {
      if (!ids.has(related)) errors.push(`${s.id}: 관련 자격증 "${related}" 가 목록에 없습니다`);
      const target = summaries.find((x) => x.id === related);
      if (target && target.country !== s.country) {
        errors.push(`${s.id}: 관련 자격증 "${related}" 의 나라(country)가 다릅니다`);
      }
      if (related === s.id) errors.push(`${s.id}: 자기 자신을 관련 자격증으로 넣었습니다`);
    }
  }
  return errors;
}

/** 자격증 상세의 단원 id 중복, 과목 문항 수 합계 검사 */
export function checkCertDetail(detail: CertDetail): string[] {
  const errors: string[] = [];
  const chapterIds = new Set<string>();
  const subjectIds = new Set<string>();
  for (const s of detail.subjects) {
    if (subjectIds.has(s.id)) errors.push(`${detail.id}: 과목 id 중복 "${s.id}"`);
    subjectIds.add(s.id);
    for (const c of s.chapters) {
      if (chapterIds.has(c.id)) errors.push(`${detail.id}: 단원 id 중복 "${c.id}"`);
      chapterIds.add(c.id);
    }
  }
  const total = detail.subjects.reduce((sum, s) => sum + s.questionCount, 0);
  if (total !== detail.examInfo.totalQuestions) {
    errors.push(
      `${detail.id}: 과목별 문항 수 합계(${total})가 전체 문항 수(${detail.examInfo.totalQuestions})와 다릅니다`,
    );
  }
  return errors;
}

/** 문제 묶음 전체 검사 (id 중복 + 과목·단원 참조) */
export function checkQuestions(questions: Question[], detail: CertDetail): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const q of questions) {
    if (ids.has(q.id)) errors.push(`문제 id 중복: ${q.id}`);
    ids.add(q.id);
    for (const e of checkQuestionRefs(q, detail)) errors.push(`${q.id}: ${e}`);
  }
  return errors;
}
