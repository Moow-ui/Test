import { describe, expect, it } from "vitest";
import {
  getCertList,
  getCertification,
  getQuestionFiles,
  getQuestionPool,
  getQuestions,
  getReadyCertifications,
} from "@/lib/data";
import { fsStore } from "@/lib/data/fs-store";
import { isQuestionIdFor, questionId, questionIdNumber } from "@/lib/data/paths";
import { validateData } from "@/lib/data/validate";
import { LEVELS, MAX_QUESTIONS_PER_FILE } from "@/lib/schemas";
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

/**
 * 문제가 준비된 자격증. 목록은 data 폴더에서 읽는다 (자격증을 추가해도 이 파일은 고치지 않는다).
 * describe 안에서 한 번만 읽어 둔다.
 */
const READY_IDS = (await getReadyCertifications()).map((c) => c.id);

describe("data 폴더 전체 검사 (npm run validate 와 같은 검사)", () => {
  it("오류가 없다", async () => {
    expect((await validateData(fsStore)).errors).toEqual([]);
  });
});

describe("자격증 목록 (data/certs 폴더에서 자동으로 만든다)", () => {
  it("id·관련 자격증 참조에 오류가 없다", async () => {
    const list = await getCertList();
    expect(list.length).toBeGreaterThan(0);
    expect(checkCertList(list)).toEqual([]);
  });

  it("문제가 준비된 자격증이 목록 맨 앞에 온다", async () => {
    expect(READY_IDS).toContain(CERT_ID);
    const list = await getCertList();
    expect(list.slice(0, READY_IDS.length).map((c) => c.id)).toEqual(READY_IDS);
    expect(list.slice(READY_IDS.length).every((c) => !c.ready)).toBe(true);
  });

  it("요약 인덱스에 시행기관과 문제 수가 들어 있다", async () => {
    for (const item of await getCertList()) {
      expect(item.questionCount, item.id).toBe((await getQuestions(item.id)).length);
      if (item.ready) expect(item.organizer, item.id).toBeTruthy();
    }
  });

  it("준비 중 자격증은 과목·시험 정보가 비어 있다", async () => {
    const soon = (await getCertList()).filter((c) => !c.ready);
    for (const item of soon) {
      const cert = await getCertification(item.id);
      expect(cert?.subjects, item.id).toEqual([]);
      expect(cert?.examInfo, item.id).toBeNull();
    }
  });
});

describe("문제 파일·id 규칙", () => {
  it("새 문제 id 는 {slug}-{단원 id}-{4자리 번호}", () => {
    expect(questionId("electrician-craftsman", "dc-circuit", 7)).toBe("electrician-craftsman-dc-circuit-0007");
    expect(isQuestionIdFor("electrician-craftsman", "electrician-craftsman-dc-circuit-0007")).toBe(true);
    expect(isQuestionIdFor("electrician-craftsman", "electrician-craftsman-p001")).toBe(false);
    expect(isQuestionIdFor("electrician-craftsman", "forklift-operator-safety-0001")).toBe(false);
    expect(questionIdNumber("electrician-craftsman", "dc-circuit", "electrician-craftsman-dc-circuit-0007")).toBe(7);
    expect(questionIdNumber("electrician-craftsman", "dc-circuit", "electrician-craftsman-p001")).toBeNull();
  });

  it("문제는 단원별 파일에 있고 파일당 최대 문항 수를 넘지 않는다", async () => {
    for (const id of READY_IDS) {
      for (const file of await getQuestionFiles(id)) {
        expect(file.questions.length, `${id}/${file.stem}`).toBeGreaterThan(0);
        expect(file.questions.length, `${id}/${file.stem}`).toBeLessThanOrEqual(MAX_QUESTIONS_PER_FILE);
        expect(new Set(file.questions.map((q) => q.chapterId)).size, `${id}/${file.stem}`).toBe(1);
      }
    }
  });

  it("문제 목록(pool)은 모든 문제를 한 번씩 담고, 들어 있는 파일을 가리킨다", async () => {
    for (const id of READY_IDS) {
      const files = await getQuestionFiles(id);
      const pool = await getQuestionPool(id);
      expect(pool.map((p) => p.id).sort(), id).toEqual(files.flatMap((f) => f.questions.map((q) => q.id)).sort());
      for (const p of pool) {
        expect(files.find((f) => f.stem === p.file)?.questions.some((q) => q.id === p.id), p.id).toBe(true);
      }
    }
  });

  it("선지 수가 자격증의 examInfo.choiceCount 와 같고 정답 번호가 그 안에 있다", async () => {
    for (const id of READY_IDS) {
      const cert = await getCertification(id);
      for (const q of await getQuestions(id)) {
        expect(q.choices, q.id).toHaveLength(cert!.examInfo!.choiceCount);
        expect(q.answer, q.id).toBeLessThanOrEqual(q.choices.length);
      }
    }
  });
});

describe("문제가 준비된 모든 자격증", () => {
  it("과목 문항 수의 합이 전체 문항 수와 같고, 단원 출제 비중 합계가 100 이다", async () => {
    for (const id of READY_IDS) {
      const cert = await getCertification(id);
      expect(cert, id).not.toBeNull();
      expect(checkCertDetail(cert as unknown as CertDetail), id).toEqual([]);
      expect(cert!.subjects.reduce((sum, s) => sum + s.questionCount, 0), id).toBe(cert!.examInfo!.totalQuestions);
      for (const s of cert!.subjects) {
        expect(s.chapters.reduce((sum, c) => sum + c.examWeight, 0), `${id}/${s.id}`).toBe(100);
      }
    }
  });

  it("모든 문제가 AI 예상문제·검수 전이고, 해설에 틀린 선지 설명이 들어 있다 (기출 없음)", async () => {
    for (const id of READY_IDS) {
      const questions = await getQuestions(id);
      expect(checkQuestions(questions, (await getCertification(id)) as unknown as CertDetail), id).toEqual([]);
      for (const q of questions) {
        expect(q.source, q.id).toBe("predicted");
        expect(q.reviewStatus, q.id).toBe("unverified");
        expect(q.pastInfo, q.id).toBeUndefined();
        expect(q.explanation.length, q.id).toBeGreaterThan(60);
      }
    }
  });

  it("모든 단원에 문제가 있고, 과목마다 초급·중급·고급 문제가 있다", async () => {
    for (const id of READY_IDS) {
      const cert = await getCertification(id);
      const questions = await getQuestions(id);
      for (const s of cert!.subjects) {
        for (const c of s.chapters) {
          expect(questions.some((q) => q.chapterId === c.id), `${id}/${c.id}`).toBe(true);
        }
        for (const level of LEVELS) {
          expect(questions.some((q) => q.subjectId === s.id && q.level === level), `${id}/${s.id}/${level}`).toBe(true);
        }
      }
    }
  });

  it("초급·중급·고급 모두 전체 범위에서 20문제까지 풀 수 있다", async () => {
    for (const id of READY_IDS) {
      const questions = await getQuestions(id);
      for (const level of ["basic", "intermediate", "advanced"] as QuizLevel[]) {
        // 초급은 과목 수가 적은 자격증에서 20문제에 못 미칠 수 있어 10문제까지만 확인한다
        const min = level === "basic" ? 10 : 20;
        expect(countAvailable(questions, level, "all"), `${id}/${level}`).toBeGreaterThanOrEqual(min);
      }
    }
  });

  it("정답 번호가 한쪽으로 쏠려 있지 않다", async () => {
    for (const id of READY_IDS) {
      const questions = await getQuestions(id);
      const choiceCount = (await getCertification(id))!.examInfo!.choiceCount;
      for (let n = 1; n <= choiceCount; n++) {
        const ratio = questions.filter((q) => q.answer === n).length / questions.length;
        expect(ratio, `${id} 정답 ${n}`).toBeGreaterThan(0.6 / choiceCount);
        expect(ratio, `${id} 정답 ${n}`).toBeLessThan(1.4 / choiceCount);
      }
    }
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
