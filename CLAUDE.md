@AGENTS.md

# 큐패스 (국가기술자격 기출·예상문제 풀이 사이트) — 프로젝트 규칙

핵심 가치: **"합격에 필요한 것만, 중요한 순서대로"**
사용 흐름: 자격증 선택 → 출제 분석 확인 → 난이도·문항 수 선택 → 한 문제씩 풀고 즉시 채점·해설

## 1. 타겟 사용자 (모든 화면·문장의 기준)

40~50대 현장 근무자. 사무실 PC나 휴대폰으로 쉬는 시간 5~10분씩 짧게 푼다. 컴퓨터에 익숙하지 않을 수 있다.

- PC와 모바일 **동등**. 1366×768 저해상도 PC와 375px 모바일에서 문제+선지가 스크롤 없이 보여야 한다.
- 기본 글자 18px(`html` font-size), 문제·선지는 20px 이상(`text-lg` 이상). 글씨 크기 3단계 버튼은 상단에 항상 보인다.
- 선지 버튼은 한 줄 전체가 클릭 영역, 높이 56px 이상(`min-h-14`).
- 명도 대비를 높게. 연회색 글씨 금지(본문은 `slate-900`, 보조 글씨도 `slate-700` 이상 / 다크는 `slate-100`·`slate-300`).
- 아이콘만 있는 버튼 금지. 항상 글자를 함께 쓴다 ("다음 문제 →").
- 애니메이션 최소화 (저사양 PC). transition·animation 을 새로 넣지 않는다.
- 로그인·회원가입 없이 모든 기능 사용. 문항 수 기본값은 5문제.
- PC 키보드: 1~4 답 선택, Enter 다음 문제.
- 웹폰트는 Pretendard (`pretendard` 패키지의 dynamic-subset CSS).

## 2. 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4, Vercel 배포
- Next.js 16 은 예전 버전과 다르다. 코드를 쓰기 전에 `node_modules/next/dist/docs/` 의 해당 문서를 확인한다. (`params` 는 Promise 등)
- 문제 데이터는 `/data` 의 JSON, 로그인 없음, 풀이 기록은 localStorage
- 검증은 zod (`lib/schemas.ts`), 테스트는 vitest (`tests/`)

## 3. 폴더 구조

```
app/                         화면 (App Router)
  page.tsx                   홈 (검색·필터·바로 풀기)
  cert/[slug]/page.tsx       자격증 메인 (시험 정보·출제 분석·문제 풀기)
  cert/[slug]/past/          기출문제 페이지 (대표 문제 서버 렌더링)
  cert/[slug]/[chapterId]/   단원별 핵심정리 + 대표 문제
  cert/[slug]/quiz/          풀이 화면 (noindex)
  cert/[slug]/cbt/           실전 CBT 체험 모드 (noindex)
  cert/[slug]/notes/         오답노트 + 인쇄 (noindex)
  admin/reports/             문제 오류 신고 목록 (숨김 경로, noindex)
  sitemap.ts, robots.ts, opengraph-image.tsx
components/                  화면 부품
lib/
  schemas.ts, types.ts       데이터 스키마(zod)와 타입
  data.ts                    ★ 데이터 접근은 여기 한 곳 (서버 전용, fs 로 /data 읽음)
  storage.ts, use-storage.ts ★ localStorage 접근은 여기 한 곳 (클라이언트 전용)
  quiz-engine.ts             출제 알고리즘 (순수 함수)
  scoring.ts                 ★ 중요도 ★·합격 기여도 % 계산은 여기 한 곳
  grading.ts                 채점·합격 판정·약점 단원
  hangul.ts                  초성 검색
  seo.ts, site.ts            title/description 규칙, 사이트 설정
data/
  certifications.json        자격증 30종 목록 (배열 순서 = 노출 우선순위)
  certs/{id}.json            시험 정보·과목·단원·본문 (준비된 자격증만)
  questions/{id}/*.json      문제 (폴더 안 json 을 모두 합쳐 읽음)
scripts/                     import-questions / validate-data / check-meta
tests/                       vitest 단위 테스트
```

나중에 Supabase(로그인·통계)로 옮길 때는 `lib/data.ts` 와 `lib/storage.ts` 의 함수 내용만 바꾼다.
화면 코드에서 `fs`, `localStorage`, `/data` 를 직접 건드리지 않는다.

## 4. 데이터 스키마 (정의는 `lib/schemas.ts`)

- **Certification**: `id`(영문 slug, URL 에 사용·변경 금지), `name`, `officialName`, `spacedName`, `shortNames[]`, `relatedCertIds[]`, `grade`(기능사/산업기사/기사/기능장/기술사), `field`, `examInfo`, `subjects[]`, `content`, `updatedAt`
  - `examInfo`: `totalQuestions`, `timeLimitMinutes`, `format`, `passCriteria { averageScore, subjectMinScore(과락 없으면 null), description }`
  - `content`: `organizer`, `eligibility`, `intro`, `trendSummary`, `studyTip`, `faqs[3~5]` — 자격증마다 직접 쓴 고유 문장
- **Subject**: `id`, `name`, `questionCount`(시험에서 이 과목 문항 수), `chapters[]`
- **Chapter**: `id`, `name`, `importance`(1~5), `examWeight`(과목 내 %, 합계 100), `summary`, `keyPoints[]`
  - 단원 id 는 자격증 안에서 유일해야 하고 `past`, `quiz`, `cbt`, `notes` 는 쓸 수 없다 (URL 충돌)
- **Question**: `id`, `certId`, `subjectId`, `chapterId`, `source`("past"|"predicted"), `pastInfo?{year, round}`(기출만), `level`("basic"|"intermediate"|"advanced"), `stem`, `choices`(4개), `answer`(1~4), `oneLineConcept`(40자 내외), `explanation`(마크다운), `frequency`(1~5), `reviewStatus`("verified"|"unverified"), `tags[]`

"준비 중" 자격증 = `data/certs/{id}.json` 이 없거나 문제가 0개인 자격증. (`ready: false`)

데이터를 고친 뒤에는 `npm run validate` 와 `npm test` 를 돌린다.

## 5. 계산 공식

### 5-1. 중요도 ★ / 합격 기여도 % (`lib/scoring.ts` 에만 둔다. 계수는 `SCORING` 상수)

- 중요도 ★ = round(0.6 × 단원 importance + 0.4 × 문제 frequency), 1~5 로 제한
- 합격 기여도 % = 50 + (★ − 1) × 10 + (frequency ≥ 4 ? 5 : 0), 최대 95
  - 의미: "이 유형을 확실히 맞힐 수 있으면 합격 가능성이 이 정도 수준"이라는 **추정치**. 화면에 반드시 "추정치"라고 밝힌다.
  - 실측 데이터가 생기면 `PassContributionProvider` 를 구현해 `getPassContribution` 에 넘긴다.

### 5-2. 출제 알고리즘 (`lib/quiz-engine.ts`)

1. 과목별 문항 수 = 요청 문항 수 × (과목 questionCount 비율), 최대 잔여법
2. 단원별 문항 수 = 과목 문항 수 × (단원 examWeight 비율), 최대 잔여법 (소수 부분이 같으면 중요도 높은 단원 우선)
3. 과목에 배정된 수가 단원 수보다 적으면 중요도 높은 단원부터 1문제씩
4. 세션 내 중복 금지, 최근 7일(`RECENT_DAYS`) 안에 푼 문제는 후순위
5. 단원에 문제가 모자라면 같은 과목 다른 단원 → 그래도 모자라면 다른 과목에서 보충

난이도 카드 (`LEVEL_RULES`):

| 카드 | 포함 level | 기출 목표 비율 |
|---|---|---|
| 초급 | basic | 기출 우선 |
| 중급 | basic + intermediate | 기출 우선 |
| 고급 | intermediate + advanced | 기출 50 : 예상 50 |

기출이 모자라면 예상문제로 채운다. 문항 수는 5/10/20/30, 보유 문제가 모자란 버튼은 비활성화.

### 5-3. 합격 판정 (`lib/grading.ts`)

- 과락 없음(`subjectMinScore: null`, 기능사): 전체 정답률 ≥ `averageScore` 이면 합격
- 과락 있음(산업기사·기사): 과목 평균 ≥ `averageScore` **그리고** 모든 과목 ≥ `subjectMinScore`
- 약점 단원: 틀린 문제가 있는 단원 중 정답률 낮은 순 3개

## 6. 콘텐츠 정책

- **기출문제 저작권은 한국산업인력공단에 있다. 기출 원문을 임의로 생성하거나 복제하지 않는다.**
  권리가 확인된 기출 데이터는 사용자가 `npm run import` 로 직접 넣는다.
- 직접 만든 문제는 반드시 `source: "predicted"`, `reviewStatus: "unverified"` 로 표시한다.
- 전기설비 과목은 최신 KEC(한국전기설비규정) 기준으로 쓴다. (저압 = 교류 1kV 이하, 전선 색상 갈·흑·회·청 등)
- 해설 작성 기준: **"현장 경험은 있지만 이론 공부는 오랜만인 50대가 이해할 수 있는 수준"**
  - 쉬운 말로 쓴다. 전문용어는 처음 나올 때 괄호로 풀어쓴다.
  - 계산 문제는 풀이를 번호 목록으로 1단계씩 줄바꿈하고, 반드시 검산한다.
  - 오답 선지가 왜 틀렸는지 포함한다.
- 사이트 하단 고지: "기출문제 저작권은 한국산업인력공단에 있으며, AI 예상문제는 오류가 있을 수 있음"
- MVP 는 전기기능사 필기만 완성. 나머지 29종은 "준비 중".

## 7. SEO 규칙

- 자격증 페이지는 모두 `generateStaticParams` 로 정적 생성(SSG). slug 는 영문 고정, 한글 키워드는 title·H1·본문에.
- 페이지마다 title·description·H1 이 서로 달라야 한다. 문구 규칙은 `lib/seo.ts` 에 모은다.
  - 메인: "{이름} 필기 기출문제·출제경향 | 큐패스"
  - 기출: "{이름} 기출문제 무료 풀이 + 해설 | 큐패스" (기출 데이터가 없을 때는 "기출 유형 문제")
  - 단원: "{이름} {단원명} 핵심정리·기출문제 | 큐패스" (기출 데이터가 없을 때는 "핵심정리·예상문제")
- `officialName`·`spacedName`·`shortNames` 는 본문에 **자연스러운 문장**으로 넣는다. 키워드 나열·숨김 텍스트 금지.
- `/past` 와 단원 페이지는 대표 문제(최대 10개)를 정답·해설까지 서버 렌더링한다.
- 풀이 화면(`/quiz`, `/cbt`, `/notes`)과 "준비 중" 자격증 페이지는 `noindex` 이고 sitemap 에서 뺀다.
- canonical, BreadcrumbList JSON-LD, OG 이미지(자격증별 자동 생성) 유지.
- 빌드 후 `npm run check:meta` 로 title·description 중복과 noindex/sitemap 을 검사한다.

## 8. 광고 자리

`components/AdSlot.tsx` 로 자리만 잡아 둔다(지금은 아무것도 그리지 않음).
선지 버튼·다음 버튼과 붙지 않게 충분히 떨어뜨려 배치한다 (잘못 누르기 방지).

## 9. 명령어

```
npm run dev         개발 서버
npm run build       빌드 (에러 없어야 함)
npm test            단위 테스트
npm run validate    /data 검증
npm run import      문제 가져오기 (CSV/JSON → 검증 → /data 병합)
npm run check:meta  빌드 결과의 title·description 중복, noindex, sitemap 검사
```
