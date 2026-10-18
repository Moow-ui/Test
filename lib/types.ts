import type { z } from "zod";
import type {
  certContentSchema,
  certDetailSchema,
  certMetaSchema,
  certSummarySchema,
  chapterSchema,
  conceptChapterSchema,
  conceptFigureSchema,
  conceptsFileSchema,
  examInfoSchema,
  faqSchema,
  guideSchema,
  questionSchema,
  studyTipsSchema,
  subjectSchema,
  CERT_TYPES,
  COUNTRIES,
  LEVELS,
  NOTES_AUTHORS,
  SOURCES,
  VISUAL_NEEDS,
} from "./schemas";

export type CertType = (typeof CERT_TYPES)[number];
export type Country = (typeof COUNTRIES)[number];
export type Level = (typeof LEVELS)[number];
export type Source = (typeof SOURCES)[number];
export type NotesAuthor = (typeof NOTES_AUTHORS)[number];
export type VisualNeed = (typeof VISUAL_NEEDS)[number];

export type Chapter = z.infer<typeof chapterSchema>;
export type Subject = z.infer<typeof subjectSchema>;
export type ExamInfo = z.infer<typeof examInfoSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type CertContent = z.infer<typeof certContentSchema>;
export type StudyTips = z.infer<typeof studyTipsSchema>;
export type CertSummary = z.infer<typeof certSummarySchema>;
export type CertMeta = z.infer<typeof certMetaSchema>;
export type CertDetail = z.infer<typeof certDetailSchema>;
/**
 * 문제 한 건. imageSrc 는 원본 파일에는 없고, 화면에 보낼 때 lib/data 가 assets/ 의 SVG 를 읽어 붙인다
 * (data: 주소. 그림을 따로 배포하지 않아 Cloudflare 배포 파일 수가 늘지 않는다).
 */
export type Question = z.infer<typeof questionSchema> & { imageSrc?: string };
export type ConceptsFile = z.infer<typeof conceptsFileSchema>;
export type ConceptFigure = z.infer<typeof conceptFigureSchema> & { src: string };
/** 개념 정리 단원 하나. figures 에는 화면에 쓸 그림 주소(src)가 붙어 있다 (lib/data) */
export type ConceptChapter = Omit<z.infer<typeof conceptChapterSchema>, "figures"> & { figures?: ConceptFigure[] };

/**
 * 자격증 한 건.
 * 문제가 준비되지 않은 "준비 중" 자격증은 examInfo·content가 null, subjects가 빈 배열이다.
 */
export interface Certification extends CertSummary {
  examInfo: ExamInfo | null;
  subjects: Subject[];
  content: CertContent | null;
  /** 운영진 학습 팁 (없으면 상자를 그리지 않는다) */
  studyTips: StudyTips | null;
  /** 단원 핵심정리 작성 주체와 운영진 검수 날짜 (chapters.json 의 notesBy·notesReviewedAt) */
  notes: { by: NotesAuthor; reviewedAt: string | null };
  updatedAt: string | null;
  /** 문구에 "필기"를 붙이는 시험인가 (meta.json 의 writtenExam) */
  writtenExam: boolean;
  /** 과목·단원 데이터와 문제가 모두 있어 풀이가 가능한가 */
  ready: boolean;
}

/** 홈 목록·검색에 쓰는 요약 인덱스 한 줄 (빌드 때 data 폴더에서 자동으로 만든다) */
export interface CertListItem extends CertSummary {
  /** 지금 출제되는 문제 수 */
  questionCount: number;
  ready: boolean;
}

/** 문제를 뽑는 데 필요한 값만 (lib/quiz-engine.ts 가 쓰는 필드). levelLock 은 초급·중급에서 빼는 문제 */
export type QuestionKey = Pick<Question, "id" | "subjectId" | "chapterId" | "level" | "source" | "levelLock">;

/** 브라우저가 먼저 받는 문제 목록의 한 줄. file 은 그 문제가 들어 있는 단원 파일 이름 */
export interface PoolItem extends QuestionKey {
  retired: boolean;
  file: string;
}

/** 풀이 화면 난이도 카드 (초급/중급/고급) */
export type QuizLevel = Level;

export type Guide = z.infer<typeof guideSchema>;
export type GuideCategory = Guide["category"];
