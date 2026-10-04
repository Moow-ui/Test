import { z } from "zod";

/**
 * 데이터 스키마 (zod).
 * /data 폴더의 JSON과 import 스크립트가 모두 이 스키마로 검증된다.
 * 타입은 lib/types.ts에서 z.infer로 뽑아 쓴다.
 * 폴더·파일 규칙은 docs/data-rules.md, lib/data/paths.ts 참고.
 */

/**
 * 자격 종류 (시행기관과 상관없이 모든 자격증이 하나를 가진다). 화면 이름은 messages 의 certTypes.
 * 한국: 국가기술자격, 국가전문자격, 국가공인민간자격, 민간자격, 면허 / 미국: 주 면허, 연방 자격, 전문 자격증
 * other 는 자격이 아닌 검정·시험 (한국사능력검정, 시민권 시험 등)
 */
export const CERT_TYPES = [
  "national-technical",
  "national-professional",
  "accredited-private",
  "private",
  "license",
  "state-license",
  "federal-certification",
  "professional-certification",
  "other",
] as const;
/**
 * 등급별 칭호 모양 (프로필의 보유 자격증 배지. 색은 components/profile/OwnedCerts.tsx).
 * 등급(grade)은 자유롭게 적는 값이고, 여기 없는 등급·등급이 없는 자격증은 기본 모양으로 보인다.
 */
export type GradeTier = "bronze" | "silver" | "gold" | "purple" | "mint" | "teal" | "crimson";
export const GRADE_TIER: Record<string, GradeTier> = {
  기능사: "bronze",
  산업기사: "silver",
  기사: "gold",
  기능장: "purple",
  기술사: "crimson",
  "2급": "mint",
  "1급": "teal",
};
/** 자격증의 나라. KR 은 /ko, US 는 /en 에만 노출한다 (lib/i18n.ts 의 localeCountry) */
export const COUNTRIES = ["KR", "US"] as const;
export const LEVELS = ["basic", "intermediate", "advanced"] as const;
export const SOURCES = ["past", "predicted"] as const;
export const REVIEW_STATUSES = ["verified", "unverified"] as const;

/** /cert/[slug]/ 바로 아래의 고정 경로와 겹치면 안 되는 단원 id */
export const RESERVED_CHAPTER_IDS = ["past", "quiz", "cbt", "notes", "concepts", "opengraph-image"];

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "영문 소문자·숫자·하이픈(-)만 쓸 수 있습니다");

const oneToFive = z.number().int().min(1).max(5);

/** 선지 수의 범위 (자격증별 실제 값은 meta.json 의 examInfo.choiceCount) */
export const MIN_CHOICES = 2;
export const MAX_CHOICES = 6;
/**
 * 난이도 카드별로 화면에 보여 주는 선지 수: 초급 2개, 중급 3개, 고급 4개.
 * 시험의 선지 수가 이보다 적으면 있는 만큼만 보여 준다. 실전 문제풀이 는 항상 examInfo.choiceCount 그대로.
 * 어떤 선지를 남길지는 문제의 choicesByLevel 에 미리 적어 둔다 (lib/choices.ts).
 */
export const LEVEL_CHOICE_COUNT: Record<(typeof LEVELS)[number], number> = {
  basic: 2,
  intermediate: 3,
  advanced: 4,
};
/** 문제 파일 하나에 넣을 수 있는 최대 문항 수. 넘으면 {chapterId}-2.json, -3.json 으로 나눈다 */
export const MAX_QUESTIONS_PER_FILE = 300;

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
  /** 한 문제의 선지 수 (4지선다면 4). 이 자격증의 모든 문제가 이 수를 따라야 한다 */
  choiceCount: z.number().int().min(MIN_CHOICES).max(MAX_CHOICES).default(4),
  passCriteria: z.object({
    /** 합격 평균 점수 (100점 만점) */
    averageScore: z.number().min(0).max(100),
    /** 과목별 과락 기준 점수. 과락이 없으면 null (기능사) */
    subjectMinScore: z.number().min(0).max(100).nullable(),
    /** 화면에 보여 줄 합격 기준 문장 */
    description: z.string().min(1),
    /** 결과 화면 "합격선 통과 (…)" 괄호 안의 짧은 문구 (예: "2종 보통 60점"). 없으면 평균·과락 점수로 만든다 */
    shortLabel: z.string().min(1).max(30).optional(),
  }),
});

export const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

/** 시행기관 (어느 기관이든 같은 모양. 화면의 시행기관 표기·"관계 없음" 고지가 모두 이 값을 쓴다) */
export const issuerSchema = z.object({
  /** 시행기관 이름 */
  name: z.string().min(1),
  /** 시행기관 공식 사이트 (기관이 여러 곳이라 하나로 정할 수 없으면 비운다) */
  url: z.string().url().optional(),
});

/** 자격증 메인 페이지에 들어가는 자격증별 고유 본문 */
export const certContentSchema = z.object({
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

/**
 * 운영진 학습 팁 3개 (자격증 페이지의 후기란 바로 위 상자. 화면에 "운영진 작성"으로 표시한다).
 * 각 2~4문장. 그 자격증의 출제기준·단원 데이터에 근거해 쓰고, 확인할 수 없는 합격률·통계는 쓰지 않는다.
 */
export const studyTipsSchema = z.object({
  /** 공부 순서 */
  studyOrder: z.string().min(20),
  /** 자주 틀리는 단원 */
  hardChapters: z.string().min(20),
  /** 시험 당일 팁 */
  examDay: z.string().min(20),
});

/** 자격증의 기본 정보 (meta.json 의 앞부분. 목록·검색에 쓴다) */
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
  /** 등급 (기능사, 기사, 1급 등). 등급이 없는 자격증은 적지 않는다 (목록에는 자격 종류가 대신 보인다) */
  grade: z.string().min(1).optional(),
  /** 분야 (건설, 전기, IT, 사무, 조리, 운전, 의료 등). 홈의 분야 필터가 이 값으로 묶는다 */
  field: z.string().min(1),
  /** 자격 종류 */
  certType: z.enum(CERT_TYPES),
  /** 시행기관 */
  issuer: issuerSchema,
  /** 시행기관의 상표 사용 규정에 따른 상표 고지 문장 (자격증 페이지 아래에 그대로 보여 준다) */
  trademarkNotice: z.string().min(1).optional(),
});

/** 자격증 정보의 출처 (공식 출제기준 등) */
export const sourceRefSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional(),
});

/**
 * data/certs/{country}/{slug}/meta.json
 * "준비 중" 자격증은 기본 정보만 있고 examInfo·content 가 없다.
 */
export const certMetaSchema = certSummarySchema.extend({
  /** 목록에서의 순서 (작을수록 앞). 문제가 준비된 자격증은 이 값과 상관없이 항상 앞에 온다 */
  order: z.number().int().default(1000),
  /** 내용 최종 수정일 (sitemap lastmod) YYYY-MM-DD */
  updatedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  examInfo: examInfoSchema.optional(),
  /** 자격증 소개·출제 경향·FAQ */
  content: certContentSchema.optional(),
  /** 운영진 학습 팁. 문제가 있는 자격증에는 반드시 있어야 한다 (npm run validate 가 검사) */
  studyTips: studyTipsSchema.optional(),
  sources: z.array(sourceRefSchema).optional(),
});

/**
 * 단원 핵심정리(summary·keyPoints)를 쓴 주체. 단원 페이지 위에 배지로 보여 준다.
 * ai = AI 가 쓴 글, staff = 운영진이 직접 쓴 글.
 */
export const NOTES_AUTHORS = ["ai", "staff"] as const;

/** data/certs/{country}/{slug}/chapters.json */
export const chaptersFileSchema = z.object({
  /** 이 파일의 단원 핵심정리를 쓴 주체. 적지 않으면 ai (자격증 추가 루틴이 AI 로 쓴다) */
  notesBy: z.enum(NOTES_AUTHORS).default("ai"),
  /**
   * 운영진(사람)이 AI 정리글을 직접 검수한 날짜 YYYY-MM-DD.
   * 있으면 "AI 작성 · 운영진 검수", 없으면 "AI 작성 · 운영진 검수 전". 실제로 검수한 뒤에만 적는다.
   */
  notesReviewedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  subjects: z.array(subjectSchema).min(1),
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** 법령·기준 수치의 출처: 기관(법령 이름)과 기준 연도 */
export const conceptSourceSchema = z.object({
  /** 예: "산업안전보건기준에 관한 규칙(고용노동부)" */
  org: z.string().min(1),
  /** 이 수치를 확인한 기준 연도 */
  year: z.number().int().min(2000).max(2100),
});

/** 핵심 개념 카드 하나: 정의 + 외우는 요령 */
export const conceptCardSchema = z.object({
  term: z.string().min(1).max(40),
  definition: z.string().min(10).max(300),
  tip: z.string().min(5).max(200),
  /** 법령·기준 수치가 들어 있으면 반드시 적는다 */
  source: conceptSourceSchema.optional(),
});

/** 헷갈리는 것 비교표 (있을 때만) */
export const conceptCompareSchema = z
  .object({
    title: z.string().min(1),
    columns: z.array(z.string().min(1)).min(2).max(4),
    rows: z.array(z.array(z.string().min(1))).min(2).max(8),
  })
  .refine((t) => t.rows.every((r) => r.length === t.columns.length), { message: "비교표의 칸 수가 맞지 않습니다" });

export const conceptChapterSchema = z.object({
  /**
   * 작성과 분리된 검증(다시 읽고 사실·수치 확인)을 통과한 날짜. 없으면 그 단원 개념 정리 페이지를 만들지 않는다.
   * 실패한 단원은 이 값을 적지 않는다.
   */
  verifiedAt: dateSchema.optional(),
  concepts: z.array(conceptCardSchema).min(3).max(7),
  /** 자주 나오는 포인트 */
  points: z.array(z.string().min(5).max(200)).min(2).max(6),
  compare: conceptCompareSchema.optional(),
});

/**
 * data/certs/{country}/{slug}/concepts.json — 자격증 "개념 정리" 페이지 (/cert/{slug}/concepts).
 * 문장은 새로 쓴다 (교재·다른 사이트 복사 금지). 단원 키는 chapters.json 의 단원 id.
 */
export const conceptsFileSchema = z.object({
  /** 쓴 주체. ai 면 화면에 "AI 작성 · 검수 완료" */
  by: z.enum(NOTES_AUTHORS),
  chapters: z.record(z.string(), conceptChapterSchema),
});

/** data/certs/{country}/{slug}/exams/{year}-{round}.json — 실전 모의고사 구성 (문제 id 목록) */
export const examSetSchema = z.object({
  title: z.string().min(1),
  questionIds: z.array(z.string().min(1)).min(1),
});

/** 기출문제 공개 여부: public 공개, partial 일부·과거분만 공개, none 비공개 */
export const PAST_QUESTION_STATUSES = ["public", "partial", "none"] as const;

/**
 * data/cert-queue.json — 앞으로 추가할 자격증 대기 목록.
 * 나라별로 응시자 수(없으면 검색량)가 많은 순서로 적는다 (배열 순서 = 추가 순서).
 */
export const certQueueSchema = z
  .array(
    z.object({
      slug: slugSchema,
      country: z.enum(COUNTRIES),
      name: z.string().min(1),
      /** 시행기관 이름 */
      issuer: z.string().min(1),
      certType: z.enum(CERT_TYPES),
      field: z.string().min(1),
      /** 기출문제 공개 여부 */
      pastQuestions: z.enum(PAST_QUESTION_STATUSES),
      /** 공개된 문제·자료의 이용 조건 메모 (저작권, 허락 필요 여부) */
      usageNote: z.string().min(1),
      note: z.string().optional(),
    }),
  )
  .superRefine((queue, ctx) => {
    const seen = new Set<string>();
    queue.forEach((item, index) => {
      if (seen.has(item.slug)) {
        ctx.addIssue({ code: "custom", path: [index, "slug"], message: `대기 목록에 같은 slug 가 두 번 있습니다 (${item.slug})` });
      }
      seen.add(item.slug);
    });
  });

/** meta.json + chapters.json 을 합친 모양 (문제가 준비된 자격증) */
export const certDetailSchema = z.object({
  id: slugSchema,
  /** 내용 최종 수정일 (sitemap lastmod) YYYY-MM-DD */
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  examInfo: examInfoSchema,
  subjects: z.array(subjectSchema).min(1),
  /** 자격증 소개·출제 경향·FAQ. 과목·단원 구조만 먼저 넣은 자격증은 비워 둘 수 있다 */
  content: certContentSchema.optional(),
});

/** 한 난이도에서 남길 선지 번호 (1부터, 원래 순서대로) */
const keptChoicesSchema = z.array(z.number().int().min(1).max(MAX_CHOICES)).min(MIN_CHOICES);

/**
 * choicesByLevel·levelLock 이 규칙에 맞는지 검사해 오류 문장을 돌려준다.
 *  - 그 난이도의 선지 수(LEVEL_CHOICE_COUNT)가 문제의 선지 수보다 적으면 남길 선지를 반드시 적는다.
 *  - 남길 선지에는 정답이 들어 있어야 하고, 쉬운 난이도의 선지는 어려운 난이도의 선지 안에 들어 있어야 한다.
 *  - levelLock 문제는 선지를 줄이지 않으므로 choicesByLevel 을 적지 않는다.
 */
export function checkChoicesByLevel(q: {
  choices: string[];
  answer: number;
  levelLock: boolean;
  choicesByLevel?: Partial<Record<(typeof LEVELS)[number], number[]>>;
}): string[] {
  const errors: string[] = [];
  let larger: number[] | null = null;
  for (const level of [...LEVELS].reverse()) {
    const want = LEVEL_CHOICE_COUNT[level];
    const kept = q.choicesByLevel?.[level];
    if (q.levelLock || want >= q.choices.length) {
      if (kept) {
        errors.push(
          q.levelLock
            ? `choicesByLevel.${level}: levelLock 문제는 선지를 줄이지 않습니다 (choicesByLevel 을 지우세요)`
            : `choicesByLevel.${level}: 이 난이도는 선지를 모두 보여 주므로 적지 않습니다`,
        );
      }
      continue;
    }
    if (!kept) {
      errors.push(`choicesByLevel.${level}: 남길 선지 ${want}개를 적어야 합니다 (줄일 수 없는 문제면 levelLock: true)`);
      continue;
    }
    if (kept.length !== want) errors.push(`choicesByLevel.${level}: 선지 번호가 ${want}개여야 합니다 (${kept.length}개)`);
    if (kept.some((n, i) => n > q.choices.length || (i > 0 && n <= kept[i - 1]))) {
      errors.push(`choicesByLevel.${level}: 1~${q.choices.length} 사이의 번호를 작은 것부터 겹치지 않게 적습니다`);
    }
    if (!kept.includes(q.answer)) errors.push(`choicesByLevel.${level}: 정답(${q.answer}번)이 들어 있어야 합니다`);
    if (larger && kept.some((n) => !larger!.includes(n))) {
      errors.push(`choicesByLevel.${level}: 더 어려운 난이도에서 남기는 선지 안에서 골라야 합니다`);
    }
    larger = kept;
  }
  return errors;
}

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
    /** 선지. 개수는 자격증의 examInfo.choiceCount 와 같아야 한다 (npm run validate 가 검사) */
    choices: z.array(z.string().min(1)).min(MIN_CHOICES).max(MAX_CHOICES),
    /** 정답 번호 (1부터, 선지 수 이하) */
    answer: z.number().int().min(1).max(MAX_CHOICES),
    /** 핵심 개념 한 줄 (40자 내외) */
    oneLineConcept: z.string().min(1).max(70),
    /** 상세 해설 (마크다운) */
    explanation: z.string().min(1),
    /** 이 개념의 출제 빈도 1~5 */
    frequency: oneToFive,
    /**
     * verified = 작성과 분리된 AI 검증(정답을 가리고 다시 풀기)을 통과한 문제 → 화면에 "검수 완료".
     * unverified = 검증 기록이 없는 문제 → "검수 전".
     */
    reviewStatus: z.enum(REVIEW_STATUSES),
    /** 검증을 통과한 날짜 YYYY-MM-DD. verified 문제에만, 반드시 적는다 */
    reviewedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    tags: z.array(z.string()).default([]),
    /** 문제 그림 파일 이름 (자격증 폴더의 assets/ 안) */
    image: z.string().min(1).optional(),
    /**
     * 난이도 카드별로 남길 선지 번호 (정답 + 가장 그럴듯한 오답). 초급 2개, 중급 3개, 고급 4개.
     * 선지를 모두 보여 주는 난이도는 적지 않는다 (4지선다면 basic·intermediate 만).
     */
    choicesByLevel: z
      .object({
        basic: keptChoicesSchema.optional(),
        intermediate: keptChoicesSchema.optional(),
        advanced: keptChoicesSchema.optional(),
      })
      .optional(),
    /**
     * true 면 선지를 줄일 수 없는 문제다 ("옳지 않은 것은?", "모두 고르시오" 등).
     * 초급·중급에는 나오지 않고, 나올 때는 항상 선지를 모두 보여 준다.
     */
    levelLock: z.boolean().default(false),
    /** 문제 내용을 고칠 때마다 1씩 올린다 (id 는 바꾸지 않는다) */
    version: z.number().int().positive().default(1),
    /** 삭제 대신 true 로 표시한다. 새로 출제되지 않지만 오답노트·기록에서는 계속 보인다 */
    retired: z.boolean().default(false),
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
    if (q.reviewStatus === "verified" && !q.reviewedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "검수 완료(reviewStatus=verified) 문제는 reviewedAt(검증 통과 날짜)이 필요합니다",
      });
    }
    if (q.reviewStatus === "unverified" && q.reviewedAt) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewedAt"],
        message: "reviewedAt 이 있으면 reviewStatus 는 verified 여야 합니다",
      });
    }
    if (new Set(q.choices).size !== q.choices.length) {
      ctx.addIssue({
        code: "custom",
        path: ["choices"],
        message: "선지가 서로 달라야 합니다",
      });
    }
    if (q.answer > q.choices.length) {
      ctx.addIssue({
        code: "custom",
        path: ["answer"],
        message: "정답 번호가 선지 수보다 큽니다",
      });
      return;
    }
    for (const message of checkChoicesByLevel(q)) {
      ctx.addIssue({ code: "custom", path: ["choicesByLevel"], message });
    }
  });
