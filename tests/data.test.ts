import { describe, expect, it } from "vitest";
import { getCertList, getCertification, getQuestions, getReadyCertifications } from "@/lib/data";
import { LEVELS } from "@/lib/schemas";
import {
  QUIZ_COUNTS,
  buildLevelQuiz,
  buildMockExam,
  countAvailable,
  createRng,
} from "@/lib/quiz-engine";
import { checkCertDetail, checkCertList, checkQuestions } from "@/lib/validate";
import type { CertDetail, QuizLevel } from "@/lib/types";

/** /data 폴더의 실제 데이터 검증 */

const CERT_ID = "electrician-craftsman";

describe("자격증 목록", () => {
  it("30종이 있고 id·관련 자격증 참조에 오류가 없다", async () => {
    const list = await getCertList();
    expect(list).toHaveLength(30);
    expect(checkCertList(list)).toEqual([]);
  });

  it("문제가 준비된 자격증은 전기기능사 하나다 (MVP)", async () => {
    const ready = await getReadyCertifications();
    expect(ready.map((c) => c.id)).toEqual([CERT_ID]);
  });

  it("준비 중 자격증은 과목·시험 정보가 비어 있다", async () => {
    const cert = await getCertification("forklift-operator");
    expect(cert?.ready).toBe(false);
    expect(cert?.subjects).toEqual([]);
    expect(cert?.examInfo).toBeNull();
  });
});

describe("전기기능사 데이터", () => {
  it("과목 3개 × 20문항, 단원 출제 비중 합계 100", async () => {
    const cert = await getCertification(CERT_ID);
    expect(cert).not.toBeNull();
    expect(cert!.subjects.map((s) => s.name)).toEqual(["전기이론", "전기기기", "전기설비"]);
    for (const s of cert!.subjects) {
      expect(s.questionCount).toBe(20);
      expect(s.chapters.reduce((sum, c) => sum + c.examWeight, 0)).toBe(100);
    }
    expect(checkCertDetail(cert as unknown as CertDetail)).toEqual([]);
  });

  it("기능사이므로 과락 기준이 없다", async () => {
    const cert = await getCertification(CERT_ID);
    expect(cert!.examInfo!.passCriteria).toMatchObject({ averageScore: 60, subjectMinScore: null });
  });

  it("문제: 총 45문제 이상, 과목당 15문제 이상, 레벨별로 고르게", async () => {
    const cert = await getCertification(CERT_ID);
    const questions = await getQuestions(CERT_ID);
    expect(questions.length).toBeGreaterThanOrEqual(45);
    for (const s of cert!.subjects) {
      const inSubject = questions.filter((q) => q.subjectId === s.id);
      expect(inSubject.length).toBeGreaterThanOrEqual(15);
      for (const level of LEVELS) {
        expect(inSubject.filter((q) => q.level === level).length).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("문제의 과목·단원 참조와 id 에 오류가 없다", async () => {
    const cert = await getCertification(CERT_ID);
    const questions = await getQuestions(CERT_ID);
    expect(checkQuestions(questions, cert as unknown as CertDetail)).toEqual([]);
  });

  it("모든 단원에 문제가 1개 이상 있다", async () => {
    const cert = await getCertification(CERT_ID);
    const questions = await getQuestions(CERT_ID);
    for (const s of cert!.subjects) {
      for (const c of s.chapters) {
        expect(questions.some((q) => q.chapterId === c.id), `${c.name} 단원`).toBe(true);
      }
    }
  });

  it("샘플 문제는 모두 AI 예상문제·검수 전으로 표시되어 있다 (기출 원문 없음)", async () => {
    const questions = await getQuestions(CERT_ID);
    for (const q of questions) {
      expect(q.source).toBe("predicted");
      expect(q.reviewStatus).toBe("unverified");
      expect(q.pastInfo).toBeUndefined();
    }
  });

  it("한 줄 핵심은 45자 이내, 해설에는 틀린 선지 설명이 들어 있다", async () => {
    const questions = await getQuestions(CERT_ID);
    for (const q of questions) {
      expect(q.oneLineConcept.length, q.id).toBeLessThanOrEqual(45);
      expect(q.explanation.length, q.id).toBeGreaterThan(80);
    }
  });

  it("정답 번호가 한쪽으로 쏠려 있지 않다", async () => {
    const questions = await getQuestions(CERT_ID);
    for (const n of [1, 2, 3, 4]) {
      const ratio = questions.filter((q) => q.answer === n).length / questions.length;
      expect(ratio).toBeGreaterThan(0.15);
      expect(ratio).toBeLessThan(0.35);
    }
  });
});

describe("초급/중급/고급 × 5/10/20/30 조합", () => {
  const levels: QuizLevel[] = ["basic", "intermediate", "advanced"];

  it("보유 문제가 충분한 조합은 모두 요청한 수만큼 중복 없이 출제된다", async () => {
    const cert = await getCertification(CERT_ID);
    const questions = await getQuestions(CERT_ID);
    const scopes = ["all", ...cert!.subjects.map((s) => s.id)];
    let enabled = 0;
    let disabled = 0;

    for (const level of levels) {
      for (const scope of scopes) {
        const available = countAvailable(questions, level, scope);
        for (const count of QUIZ_COUNTS) {
          if (available < count) {
            disabled += 1; // 화면에서 버튼이 비활성화되는 조합
            continue;
          }
          enabled += 1;
          const quiz = buildLevelQuiz({
            subjects: cert!.subjects,
            questions,
            level,
            count,
            subjectId: scope,
            rng: createRng(count),
          });
          expect(quiz, `${level}/${scope}/${count}`).toHaveLength(count);
          expect(new Set(quiz.map((q) => q.id)).size).toBe(count);
          if (scope !== "all") expect(quiz.every((q) => q.subjectId === scope)).toBe(true);
        }
      }
    }
    expect(enabled).toBeGreaterThan(0);
    expect(disabled).toBeGreaterThan(0);
  });

  it("전체 범위에서는 중급·고급의 5/10/20/30 이 모두 가능하다", async () => {
    const questions = await getQuestions(CERT_ID);
    expect(countAvailable(questions, "basic", "all")).toBeGreaterThanOrEqual(20);
    expect(countAvailable(questions, "intermediate", "all")).toBeGreaterThanOrEqual(30);
    expect(countAvailable(questions, "advanced", "all")).toBeGreaterThanOrEqual(30);
  });

  it("실전 CBT 모의고사는 60문항(과목별 20문항)으로 출제된다", async () => {
    const cert = await getCertification(CERT_ID);
    const questions = await getQuestions(CERT_ID);
    const exam = buildMockExam({
      subjects: cert!.subjects,
      questions,
      totalQuestions: cert!.examInfo!.totalQuestions,
      rng: createRng(1),
    });
    expect(exam).toHaveLength(60);
    for (const s of cert!.subjects) {
      expect(exam.filter((q) => q.subjectId === s.id)).toHaveLength(20);
    }
  });
});
