import type { ExamInfo, Question, Subject } from "./types";

/** 채점·합격 판정 */

export interface GradedItem {
  questionId: string;
  subjectId: string;
  chapterId: string;
  /** 고른 답 (1~4). 안 풀었으면 null */
  chosen: number | null;
  answer: number;
  correct: boolean;
}

export interface GroupStat {
  id: string;
  name: string;
  total: number;
  correct: number;
  /** 정답률 0~100 */
  score: number;
}

export interface ChapterStat extends GroupStat {
  subjectId: string;
  importance: number;
}

export interface PassVerdict {
  passed: boolean;
  /** 판정에 쓴 평균 점수 */
  averageScore: number;
  requiredAverage: number;
  /** 과목별 과락 기준 (없으면 null) */
  subjectMinScore: number | null;
  /** 과락에 걸린 과목 */
  failedSubjects: GroupStat[];
}

export interface QuizSummary {
  total: number;
  correct: number;
  score: number;
  bySubject: GroupStat[];
  byChapter: ChapterStat[];
  /** 정답률 낮은 단원 상위 3개 (틀린 문제가 있는 단원만) */
  weakChapters: ChapterStat[];
  verdict: PassVerdict | null;
}

export const WEAK_CHAPTER_COUNT = 3;

function percent(correct: number, total: number): number {
  return total === 0 ? 0 : (correct / total) * 100;
}

export function gradeQuiz(
  questions: Question[],
  answers: Record<string, number | undefined>,
): GradedItem[] {
  return questions.map((q) => {
    const chosen = answers[q.id] ?? null;
    return {
      questionId: q.id,
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      chosen,
      answer: q.answer,
      correct: chosen === q.answer,
    };
  });
}

/**
 * 실제 시험의 합격 기준으로 판정한다.
 *  - 과락이 없는 시험(기능사): 전체 정답률이 합격 점수 이상이면 합격
 *  - 과락이 있는 시험(산업기사·기사): 과목 평균이 합격 점수 이상이고,
 *    모든 과목이 과락 기준 이상이어야 합격
 * 이번 풀이에 한 문제도 나오지 않은 과목은 판정에서 뺀다.
 */
export function judgePass(
  criteria: ExamInfo["passCriteria"],
  bySubject: GroupStat[],
  overallScore: number,
): PassVerdict {
  const present = bySubject.filter((s) => s.total > 0);
  const min = criteria.subjectMinScore;

  if (min === null) {
    return {
      passed: overallScore >= criteria.averageScore,
      averageScore: overallScore,
      requiredAverage: criteria.averageScore,
      subjectMinScore: null,
      failedSubjects: [],
    };
  }

  const average =
    present.length === 0 ? 0 : present.reduce((sum, s) => sum + s.score, 0) / present.length;
  const failedSubjects = present.filter((s) => s.score < min);
  return {
    passed: average >= criteria.averageScore && failedSubjects.length === 0,
    averageScore: average,
    requiredAverage: criteria.averageScore,
    subjectMinScore: min,
    failedSubjects,
  };
}

export function summarize(
  items: GradedItem[],
  cert: { subjects: Subject[]; examInfo: ExamInfo | null },
): QuizSummary {
  const total = items.length;
  const correct = items.filter((i) => i.correct).length;
  const score = percent(correct, total);

  const bySubject: GroupStat[] = [];
  const byChapter: ChapterStat[] = [];

  for (const subject of cert.subjects) {
    const inSubject = items.filter((i) => i.subjectId === subject.id);
    if (inSubject.length === 0) continue;
    const subjectCorrect = inSubject.filter((i) => i.correct).length;
    bySubject.push({
      id: subject.id,
      name: subject.name,
      total: inSubject.length,
      correct: subjectCorrect,
      score: percent(subjectCorrect, inSubject.length),
    });

    for (const chapter of subject.chapters) {
      const inChapter = inSubject.filter((i) => i.chapterId === chapter.id);
      if (inChapter.length === 0) continue;
      const chapterCorrect = inChapter.filter((i) => i.correct).length;
      byChapter.push({
        id: chapter.id,
        name: chapter.name,
        subjectId: subject.id,
        importance: chapter.importance,
        total: inChapter.length,
        correct: chapterCorrect,
        score: percent(chapterCorrect, inChapter.length),
      });
    }
  }

  const weakChapters = byChapter
    .filter((c) => c.correct < c.total)
    .sort(
      (a, b) =>
        a.score - b.score ||
        b.total - b.correct - (a.total - a.correct) ||
        b.importance - a.importance,
    )
    .slice(0, WEAK_CHAPTER_COUNT);

  return {
    total,
    correct,
    score,
    bySubject,
    byChapter,
    weakChapters,
    verdict: cert.examInfo ? judgePass(cert.examInfo.passCriteria, bySubject, score) : null,
  };
}
