import { z } from "zod";

/**
 * 데이터 스키마 (zod).
 * /data 폴더의 JSON과 import 스크립트가 모두 이 스키마로 검증된다.
 * 타입은 lib/types.ts에서 z.infer로 뽑아 쓴다.
 */

/** 한국 자격증의 등급 + 미국 자격증의 종류(Certification, License) */
export const GRADES = [
  "기능사",
  "산업기사",
  "기사",
  "기능장",
  "기술사",
  "1급",
  "2급",
  "Certification",
  "License",
] as const;
/** 등급별 칭호 모양 (프로필의 보유 자격증 배지. 색은 components/profile/OwnedCerts.tsx) */
export type GradeTier = "bronze" | "silver" | "gold" | "purple" | "mint" | "teal" | "crimson";
export const GRADE_TIER: Record<(typeof GRADES)[number], GradeTier> = {
  기능사: "bronze",
  산업기사: "silver",
  기사: "gold",
  기능장: "purple",
  기술사: "crimson",
  "2급": "mint",
  "1급": "teal",
  Certification: "teal",
  License: "gold",
};
/** 자격증의 나라. KR 은 /ko, US 는 /en 에만 노출한다 (lib/i18n.ts 의 localeCountry) */
export const COUNTRIES = ["KR", "US"] as const;
export const LEVELS = ["basic", "intermediate", "advanced"] as const;
export const SOURCES = ["past", "predicted"] as const;
export const REVIEW_STATUSES = ["verified", "unverified"] as const;

/** /cert/[slug]/ 바로 아래의 고정 경로와 겹치면 안 되는 단원 id */
export const RESERVED_CHAPTER_IDS = ["past", "quiz", "cbt", "notes", "opengraph-image"];

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "영문 소문자·숫자·하이픈(-)만 쓸 수 있습니다");

const oneToFive = z.number().int().min(1).max(5);

export const chapterSchema = z.object({
  id: slugSchema.refine((v) => !RESERVED_CHAPTER_IDS.includes(v), {
    message: `단원 id로 쓸 수 없는 이름입니다 (${RESERVED_CHAPTER_IDS.join(", ")})`,
  }),
  name: z.string().min(1),
  /** 중요도 1~5 */
  importance: oneToFive,
  /** 과목 내 출제 비중 % (과목 안에서 합계 100) */
  examWeight: z.number().min(0).max(100),
  /** 단원 핵심 2~3줄 */
  summary: z.string().min(1),
  /** 단원 페이지에 보여 줄 핵심 정리 항목 */
  keyPoints: z.array(z.string().min(1)).default([]),
});

export const subjectSchema = z
  .object({
    id: slugSchema,
    name: z.string().min(1),
    /** 실제 시험에서 이 과목이 출제되는 문항 수 */
    questionCount: z.number().int().positive(),
    chapters: z.array(chapterSchema).min(1),
  })
  .refine(
    (s) => Math.abs(s.chapters.reduce((sum, c) => sum + c.examWeight, 0) - 100) < 0.01,
    { message: "한 과목 안의 단원 examWeight 합계는 100이어야 합니다" },
  );

export const examInfoSchema = z.object({
  /** 필기 전체 문항 수 */
  totalQuestions: z.number().int().positive(),
  /** 필기 제한 시간(분) */
  timeLimitMinutes: z.number().int().positive(),
  /** 시험 방식 설명 (예: 객관식 4지 택일형, CBT) */
  format: z.string().min(1),
  passCriteria: z.object({
    /** 합격 평균 점수 (100점 만점) */
    averageScore: z.number().min(0).max(100),
    /** 과목별 과락 기준 점수. 과락이 없으면 null (기능사) */
    subjectMinScore: z.number().min(0).max(100).nullable(),
    /** 화면에 보여 줄 합격 기준 문장 */
    description: z.string().min(1),
  }),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/** 자격증 메인 페이지에 들어가는 자격증별 고유 본문 */
export const certContentSchema = z.object({
  /** 시행기관 */
  organizer: z.string().min(1),
  /** 응시자격 */
  eligibility: z.string().min(1),
  /** 자격증 소개 (검색 키워드 변형이 자연스럽게 들어간 문단) */
  intro: z.string().min(1),
  /** 출제 경향 요약 */
  trendSummary: z.string().min(1),
  /** 공부 방법 한 문단 */
  studyTip: z.string().min(1),
  faqs: z.array(faqSchema).min(3).max(5),
});

/** data/certifications.json 의 한 줄 (자격증 목록) */
export const certSummarySchema = z.object({
  /** URL에 쓰는 영문 slug (예: forklift-operator). 한번 정하면 바꾸지 않는다 */
  id: slugSchema,
  country: z.enum(COUNTRIES),
  name: z.string().min(1),
  /** 공식 명칭 (붙여쓰기) */
  officialName: z.string().min(1),
  /** 띄어쓰기 변형 */
  spacedName: z.string().min(1),
  /** 줄임말·검색어 변형 */
  shortNames: z.array(z.string().min(1)),
  relatedCertIds: z.array(slugSchema),
  grade: z.enum(GRADES),
  field: z.string().min(1),
});

/** data/certs/{id}.json (문제가 준비된 자격증만 존재) */
export const certDetailSchema = z.object({
  id: slugSchema,
  /** 내용 최종 수정일 (sitemap lastmod) YYYY-MM-DD */
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  examInfo: examInfoSchema,
  subjects: z.array(subjectSchema).min(1),
  /** 자격증 소개·출제 경향·FAQ. 과목·단원 구조만 먼저 넣은 자격증은 비워 둘 수 있다 */
  content: certContentSchema.optional(),
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    certId: slugSchema,
    subjectId: slugSchema,
    chapterId: slugSchema,
    source: z.enum(SOURCES),
    /** 기출일 때만 */
    pastInfo: z
      .object({
        year: z.number().int().min(1990).max(2100),
        round: z.number().int().min(1).max(10),
      })
      .optional(),
    level: z.enum(LEVELS),
    stem: z.string().min(1),
    choices: z.tuple([
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
    ]),
    /** 정답 번호 1~4 */
    answer: z.number().int().min(1).max(4),
    /** 핵심 개념 한 줄 (40자 내외) */
    oneLineConcept: z.string().min(1).max(70),
    /** 상세 해설 (마크다운) */
    explanation: z.string().min(1),
    /** 이 개념의 출제 빈도 1~5 */
    frequency: oneToFive,
    reviewStatus: z.enum(REVIEW_STATUSES),
    tags: z.array(z.string()).default([]),
  })
  .superRefine((q, ctx) => {
    if (q.source === "past" && !q.pastInfo) {
      ctx.addIssue({
        code: "custom",
        path: ["pastInfo"],
        message: "기출(source=past) 문제는 pastInfo(year, round)가 필요합니다",
      });
    }
    if (q.source === "predicted" && q.pastInfo) {
      ctx.addIssue({
        code: "custom",
        path: ["pastInfo"],
        message: "예상문제(source=predicted)에는 pastInfo를 넣지 않습니다",
      });
    }
    if (new Set(q.choices).size !== 4) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "선지 4개가 서로 달라야 합니다",
      });
    }
  });
