import type { z } from "zod";
import type {
  certContentSchema,
  certDetailSchema,
  certSummarySchema,
  chapterSchema,
  examInfoSchema,
  faqSchema,
  questionSchema,
  subjectSchema,
  COUNTRIES,
  GRADES,
  LEVELS,
  SOURCES,
} from "./schemas";

export type Grade = (typeof GRADES)[number];
export type Country = (typeof COUNTRIES)[number];
export type Level = (typeof LEVELS)[number];
export type Source = (typeof SOURCES)[number];

export type Chapter = z.infer<typeof chapterSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type ExamInfo = z.infer<typeof examInfoSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type CertContent = z.infer<typeof certContentSchema>;
export type CertSummary = z.infer<typeof certSummarySchema>;
export type CertDetail = z.infer<typeof certDetailSchema>;
export type Question = z.infer<typeof questionSchema>;

/**
 * 자격증 한 건.
 * 문제가 준비되지 않은 "준비 중" 자격증은 examInfo·content가 null, subjects가 빈 배열이다.
 */
export interface Certification extends CertSummary {
  examInfo: ExamInfo | null;
  subjects: Subject[];
  content: CertContent | null;
  updatedAt: string | null;
  /** 과목·단원 데이터와 문제가 모두 있어 풀이가 가능한가 */
  ready: boolean;
}

/** 홈 목록·검색에 쓰는 가벼운 형태 */
export interface CertListItem extends CertSummary {
  ready: boolean;
}

/** 풀이 화면 난이도 카드 (초급/중급/고급) */
export type QuizLevel = Level;
