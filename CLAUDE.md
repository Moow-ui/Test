@AGENTS.md

# 큐패스 (국가기술자격 기출·예상문제 풀이 사이트) — 프로젝트 규칙

한 줄 소개: **"세상의 모든 자격증. 5분 문제 연습하기."**
사용 흐름: 자격증 선택 → 초급/중급/고급 선택 → 실제 CBT 와 같은 화면에서 풀이 → 채점·해설

- 저장소: https://github.com/Moow-ui/Test (브랜치 `main`). 작업을 마치면 커밋하고 push 한다.
- 배포: Cloudflare Workers (Workers Builds). push 하면 자동으로 빌드·배포된다.

## 1. 타겟 사용자 (모든 화면·문장의 기준)

40~50대 현장 근무자. 사무실 PC나 휴대폰으로 쉬는 시간 5~10분씩 짧게 푼다. 컴퓨터에 익숙하지 않을 수 있다.

- PC와 모바일 **동등**. 1366×768 저해상도 PC와 375px 모바일에서 문제+선지가 스크롤 없이 보여야 한다.
- 일반 화면의 기본 글자는 18px(`html` font-size). 상단에 글씨 크기 3단계 버튼이 항상 보인다.
- 명도 대비를 높게. 연회색 글씨 금지(글자색은 `ink`, `ink-sub` 두 가지만).
- 아이콘만 있는 버튼 금지. 항상 글자를 함께 쓴다 ("다음 ▶").
- 애니메이션 최소화 (저사양 PC). transition·animation 을 새로 넣지 않는다.
- 로그인하지 않아도 모든 기능을 쓸 수 있어야 한다 (로그인은 기록을 계정에 저장하는 선택 기능). 문제 수 기본값은 5문제.
- 웹폰트는 Pretendard. 처음 방문한 화면은 기기 글꼴로 바로 그리고 다음 화면부터 적용한다 (`components/FontLoader.tsx`).
- 화면 밖의 긴 묶음에는 `cv` 클래스(content-visibility: auto)를 붙인다. 인쇄 화면(오답노트)에는 붙이지 않는다.

### 화면 원칙: 본론만 보이게 (사용자 결정)

- 글자는 최대한 숨겨 두고 눌러야 보이게 한다. 설명 문장을 화면에 늘어놓지 않는다.
- **홈**: 제목 "세상의 모든 자격증. 5분 문제 연습하기." + 자격증 이름 검색(초성 가능) + 목록. 등급·분야 필터는 두지 않는다.
- **자격증 화면** (`components/cert/CertBoxes.tsx`)
  - 가장 먼저 큰 박스 3개: 초급 / 중급 / 고급. 누르면 바로 아래에 범위 → 문제 수 → **[시험 시작하기]**.
  - 그 아래 별도 칸: 실전 CBT 체험.
  - 그 아래 접힌 묶음 2개만: 시험 정보, 출제 분석.
  - 출제 경향 요약·자격증 소개·자주 묻는 질문은 **맨 아래에 작게** 접어 둔다. (`<details>`, 내용은 HTML 에 유지 → 검색 노출용)
- 자격증 화면의 제목(H1)은 "{이름} 합격 문제 풀기".
- **결과 화면** (`components/quiz/ResultView.tsx`): 점수 → 과목별 정답률 → **틀린 핵심 개념**(문제마다 한 줄) → 약한 단원 → 버튼 → 문제별 결과.
- **내 정보** (`/profile`, `components/profile/`): 로그인 안 했으면 로그인·회원가입 폼. 로그인하면 이름·칭호(보유 자격증 배지)·요약 수치가
  맨 위에 보이고, 나머지(자격증 등록, 점수 기록, 내가 푼 문제, 내가 틀린 문제, 틀린 문제 핵심 개념, 나만의 오답노트)는 접혀 있다.
- **출제 분석** (`components/cert/AnalysisPanel.tsx`): 과목을 가로로 나란히, 단원은 "1단원 : 직류회로" 형식. 막대 그래프 없이 ★ 와 출제 비중 % 만.
- **시험 화면** (`components/exam/ExamScreen.tsx`, 연습 풀이·실전 CBT 공용): 실제 큐넷 CBT 화면과 같은 배열.
  - 위: 종목명 · 전체 문제 수/안 푼 문제 수(실전 CBT 는 남은 시간), 글자크기 100·150·200%
  - 가운데: 문제 + 보기 ①~④, 오른쪽: 답안 표기란
  - 아래: 이전 · 다음 · **바로 답 확인하기 체크박스**(연습 풀이만, 기본 켜짐) · 안 푼 문제 · 채점하기(답안 제출)
  - 체크박스가 켜져 있으면 보기를 고르는 즉시 채점해 정답·핵심·합격 가능성을 보여 주고 답을 잠근다.
    꺼져 있으면 답만 표시하고 넘어가며, 마지막 문제에서 "채점하기"를 누르면 한꺼번에 채점한다.
  - 문제 위에 출처를 작게 표시한다: "2024년 1회 기출" 또는 "AI 예상문제 · 검수 전".
  - 해설·문제 오류 신고는 눌러야 펼쳐진다.
  - 시험 화면에는 사이트 상단 메뉴·하단 안내를 넣지 않는다 (`app/(exam)/layout.tsx`).
  - 키보드: 1~4 답 선택, Enter/→ 다음, ← 이전.

## 2. 기술 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Next.js 16 은 예전 버전과 다르다. 코드를 쓰기 전에 `node_modules/next/dist/docs/` 의 해당 문서를 확인한다. (`params` 는 Promise 등)
- 배포: Cloudflare Workers + OpenNext (`@opennextjs/cloudflare`, `wrangler.jsonc`, `open-next.config.ts`)
  - 모든 페이지는 빌드 때 만들어지는 정적 페이지다. **실행 중(요청 시)에는 파일을 읽을 수 없으므로** 새 페이지도 반드시 `generateStaticParams` + `dynamicParams = false` 로 미리 만든다.
  - `wrangler.jsonc` 의 build 명령은 `opennextjs-cloudflare build` 뒤에 `populateCache local` 을 실행한다. 이 단계가 빠지면 모든 페이지가 404/500 이 된다.
- 문제 데이터는 `/data` 의 JSON. 풀이 기록은 localStorage 가 기준이고, 로그인하면 계정(DB)과 맞춘다.
- 회원 DB: Cloudflare D1 (`wrangler.jsonc` 의 `DB` 바인딩, `database_id` 없이 자동 생성). 표는 `lib/server/db.ts` 가 처음 쓸 때 만든다.
  내 컴퓨터(`npm run dev`)에서는 `.wrangler` 폴더의 로컬 DB 를 쓴다 (`next.config.ts` 의 `initOpenNextCloudflareForDev`).
  개발 서버가 켜져 있으면 `.open-next` 폴더를 잡고 있어 배포용 빌드(`opennextjs-cloudflare build`, `wrangler deploy --dry-run`)가 실패한다. 끄고 실행할 것.
- 검증은 zod (`lib/schemas.ts`), 테스트는 vitest (`tests/`)
- `.btn`, `.card`, `.link` 는 `@layer components` 에 있다. 같은 요소에 Tailwind 유틸리티를 붙이면 유틸리티가 이긴다.

## 3. 폴더 구조

```
app/
  layout.tsx                       html/body, 글꼴·테마 초기화
  (site)/                          상단 메뉴 + 하단 안내가 있는 일반 화면
    page.tsx                       홈
    cert/[slug]/page.tsx           자격증 화면
    cert/[slug]/past/              기출문제 페이지 (대표 문제 서버 렌더링)
    cert/[slug]/[chapterId]/       단원별 핵심정리 + 대표 문제
    cert/[slug]/notes/             오답노트 + 인쇄 (noindex)
    notes/, admin/reports/         오답노트 목록, 문제 오류 신고 목록(숨김 경로, noindex)
    profile/                       내 정보 (로그인·회원가입·프로필, noindex)
  (exam)/                          시험 화면 (메뉴 없음, noindex)
    cert/[slug]/quiz/              연습 풀이
    cert/[slug]/cbt/               실전 CBT 체험
  api/auth/{signup,login,logout,me}/   회원가입·로그인·로그아웃·내 정보(탈퇴)
  api/sync/                        계정 기록 불러오기·저장하기
  api/questions/[certId]/          프로필용 문제 요약 (빌드 때 만드는 정적 JSON)
  cert/[slug]/opengraph-image.tsx  자격증별 OG 이미지 (일부러 (site) 묶음 밖에 둔다)
  sitemap.ts, robots.ts, opengraph-image.tsx
components/
  exam/ExamScreen.tsx              ★ 시험 화면 (연습 풀이·CBT 공용)
  cert/, home/, quiz/, cbt/, notes/, admin/
lib/
  schemas.ts, types.ts             데이터 스키마(zod)와 타입
  data.ts, data-files.ts           ★ 데이터 접근·파일 위치 규칙은 여기 한 곳 (서버 전용, fs)
  storage.ts, use-storage.ts       ★ localStorage 접근은 여기 한 곳 (클라이언트 전용)
  auth-client.ts, sync-merge.ts    로그인 상태, 계정 기록 동기화·합치기 규칙
  auth-rules.ts                    아이디·비밀번호·닉네임 규칙 (서버·화면 공용)
  server/                          ★ 서버 전용: db.ts(D1), auth.ts(세션 쿠키), password.ts(해시)
  quiz-engine.ts                   출제 알고리즘 (순수 함수)
  past.ts                          기출 수록 기준(최근 10년), 정답률 → 난이도
  scoring.ts                       ★ 중요도 ★·합격 가능성 % 계산은 여기 한 곳
  grading.ts                       채점·합격 판정·약점 단원
  hangul.ts, seo.ts, site.ts       초성 검색, title/description 규칙, 사이트 설정
data/
  certifications.json              자격증 30종 목록 (배열 순서 = 노출 우선순위)
  certs/{id}.json                  시험 정보·과목·단원 (준비된 자격증만)
  questions/{id}/predicted/*.json  AI 예상문제
  questions/{id}/past/{난이도}/{단원 id}.json   기출 (난이도별 폴더 → 단원별 파일, 자동 분류)
scripts/                           import-questions(past:add) / past-status / validate-data / check-meta
tests/                             vitest 단위 테스트
```

화면 코드에서 `fs`, `localStorage`, `/data` 를 직접 건드리지 않는다.

## 4. 데이터 스키마 (정의는 `lib/schemas.ts`)

- **Certification**: `id`(영문 slug, URL 에 사용·변경 금지), `name`, `officialName`, `spacedName`, `shortNames[]`, `relatedCertIds[]`, `grade`, `field`, `examInfo`, `subjects[]`, `content?`, `updatedAt`
  - `examInfo`: `totalQuestions`, `timeLimitMinutes`, `format`, `passCriteria { averageScore, subjectMinScore(과락 없으면 null), description }`
  - `content`(선택): `organizer`, `eligibility`, `intro`, `trendSummary`, `studyTip`, `faqs[3~5]`
- **Subject**: `id`, `name`, `questionCount`, `chapters[]`
- **Chapter**: `id`, `name`, `importance`(1~5), `examWeight`(과목 내 %, 합계 100), `summary`, `keyPoints[]`
  - 단원 id 는 자격증 안에서 유일해야 하고 `past`, `quiz`, `cbt`, `notes` 는 쓸 수 없다 (URL 충돌)
- **Question**: `id`, `certId`, `subjectId`, `chapterId`, `source`("past"|"predicted"), `pastInfo?{year, round}`(기출만), `level`("basic"|"intermediate"|"advanced"), `stem`, `choices`(4개), `answer`(1~4), `oneLineConcept`, `explanation`(마크다운), `frequency`(1~5), `reviewStatus`, `tags[]`

"준비 중" 자격증 = `data/certs/{id}.json` 이 없거나 문제가 0개인 자격증 (`ready: false`, noindex, sitemap 제외).

데이터를 고친 뒤에는 `npm run validate` 와 `npm test` 를 돌린다.

## 5. 출제 규칙

### 5-1. 난이도 (`lib/quiz-engine.ts` 의 `LEVEL_RULES`)

| 박스 | 포함 level | 출처 |
|---|---|---|
| 초급 | basic | **기출만** |
| 중급 | basic + intermediate | **기출만** |
| 고급 | intermediate + advanced | **기출 50 : 예상 50** |

- 기출이 **하나도 등록되지 않은 자격증**만 초급·중급을 예상문제로 대신한다 (풀 문제가 없어지는 것을 막기 위함).
- 기출은 **최근 10년치만** 수록한다 (`lib/past.ts`). 더 오래된 기출은 파일에 있어도 사이트에 나오지 않는다.
- 문제 수는 5/10/20/30. 보유 문제가 모자란 버튼은 비활성화.

### 5-2. 뽑는 방법

1. 과목별 문제 수 = 요청 수 × (과목 questionCount 비율), 최대 잔여법
2. 단원별 문제 수 = 과목 문제 수 × (단원 examWeight × 중요도 가중치 `IMPORTANCE_BOOST`), 최대 잔여법
   - 중요도 가중치는 연습 풀이에만 적용. 실전 CBT 모의고사는 실제 출제 비중 그대로.
3. 과목에 배정된 수가 단원 수보다 적으면 중요도 높은 단원부터 1문제씩
4. 단원 안에서는 **매번 무작위**. 세션 내 중복 금지, 최근 7일 안에 푼 문제는 후순위
5. 단원에 문제가 모자라면 같은 과목 다른 단원 → 그래도 모자라면 다른 과목에서 보충

### 5-3. 중요도 ★ / 합격 가능성 % (`lib/scoring.ts` 에만 둔다. 계수는 `SCORING` 상수)

- 중요도 ★ = round(0.6 × 단원 importance + 0.4 × 문제 frequency), 1~5 로 제한
- 합격 가능성 % = 50 + (★ − 1) × 10 + (frequency ≥ 4 ? 5 : 0), 최대 95
- 화면 문구는 **"이 문제를 맞혔다면 합격 가능성은? N%"**. 계산 방식·추정치 설명은 화면에 넣지 않는다 (사용자 결정).
- 실측 데이터가 생기면 `PassContributionProvider` 를 구현해 `getPassContribution` 에 넘긴다.

### 5-4. 합격 판정 (`lib/grading.ts`)

- 과락 없음(`subjectMinScore: null`, 기능사): 전체 정답률 ≥ `averageScore` 이면 합격
- 과락 있음(산업기사·기사): 과목 평균 ≥ `averageScore` **그리고** 모든 과목 ≥ `subjectMinScore`

## 6. 콘텐츠 정책

- **기출문제 저작권은 한국산업인력공단에 있다. 기출 원문을 임의로 생성하거나 복제하지 않는다.**
  - 기억에 의존해 "○○년 ○회 기출"이라고 지어내지 않는다 (가짜 기출이 된다).
  - 다른 사이트의 기출·복원 문제를 긁어 오지 않는다.
  - 권리가 확인된 기출 데이터를 사용자가 주면 `npm run past:add` 로 넣는다.
- 직접 만든 문제는 반드시 `source: "predicted"`, `reviewStatus: "unverified"` 로 표시한다.
- 시험 과목·문항 수는 개편으로 자주 바뀐다 (예: 건설안전기사 2026년부터 6과목 → 5과목). 새 자격증의 `data/certs/{id}.json` 을 만들 때는 큐넷 공식 출제기준으로 확인한다.
- 전기설비 과목은 최신 KEC(한국전기설비규정) 기준으로 쓴다.
- 해설 작성 기준: "현장 경험은 있지만 이론 공부는 오랜만인 50대가 이해할 수 있는 수준". 쉬운 말, 전문용어는 괄호로 풀이, 계산은 번호 목록으로 한 단계씩 + 검산, 오답 선지가 왜 틀렸는지 포함.
- 사이트 하단 고지: "기출문제 저작권은 한국산업인력공단에 있으며, AI 예상문제는 오류가 있을 수 있음"

## 6-1. 로그인·개인정보 규칙

- 받는 정보는 **아이디·비밀번호·닉네임**뿐이다. 이메일·전화번호·실명 등은 받지 않는다 (그래서 비밀번호 찾기가 없다).
- 비밀번호는 PBKDF2-SHA256(소금 포함) 해시만 저장한다. 세션 토큰도 DB 에는 해시로만 저장하고, 쿠키는 HttpOnly·SameSite=Lax.
- 상태를 바꾸는 API 는 `isSameOrigin` 으로 다른 사이트에서 온 요청을 막는다. 로그인 5회 연속 실패 시 5분 잠금.
- 비밀번호·세션 토큰을 로그나 응답에 남기지 않는다.
- 계정에 저장하는 기록: 풀이 기록, 점수 기록, 오답노트(메모 포함), 보유 자격증 (`lib/sync-merge.ts` 의 `SYNC_FIELDS`).
  - 로그인 직후에만 이 기기의 기록과 계정 기록을 **합치고**, 그 뒤 화면을 열 때는 계정 기록으로 **바꾼다**.
  - 로그아웃하면 이 기기의 기록을 지운다 (여럿이 쓰는 PC 대비). 회원 탈퇴는 계정과 기록을 모두 지운다.
- 화면은 계속 `lib/storage.ts` 의 값만 읽는다. 서버와 맞추는 일은 `components/auth/SyncManager.tsx` 가 한다.

## 7. SEO 규칙

- slug 는 영문 고정, 한글 키워드는 title·H1·본문에. 페이지마다 title·description·H1 이 서로 달라야 한다 (`lib/seo.ts`).
  - 메인: "{이름} 필기 기출문제·출제경향 | 큐패스"
  - 기출: "{이름} 기출문제 무료 풀이 + 해설 | 큐패스" (기출 데이터가 없을 때는 "기출 유형 문제")
  - 단원: "{이름} {단원명} 핵심정리·기출문제 | 큐패스" (기출 데이터가 없을 때는 "핵심정리·예상문제")
- `/past` 와 단원 페이지는 대표 문제(최대 10개)를 정답·해설까지 서버 렌더링한다.
- 시험 화면·오답노트·"준비 중" 자격증 페이지는 `noindex` 이고 sitemap 에서 뺀다.
- 화면에서 접어 둔 내용(`<details>`)도 HTML 에는 그대로 둔다. 키워드 나열·숨김 텍스트는 금지.
- 빌드 후 `npm run check:meta` 로 title·description 중복과 noindex/sitemap 을 검사한다.

## 8. 광고 자리

`components/AdSlot.tsx` 로 자리만 잡아 둔다(지금은 아무것도 그리지 않음).
선지·다음 버튼과 붙지 않게 배치한다. 시험 화면에는 넣지 않는다.

## 9. 명령어

```
npm run dev          개발 서버
npm run build        빌드 (에러 없어야 함)
npm test             단위 테스트
npm run validate     /data 검증
npm run past:add     기출(또는 예상문제) 넣기·갱신 (CSV/JSON → 검증 → 난이도·단원별 파일로 자동 분류)
npm run past:status  기출 현황
npm run past:prune   최근 10년보다 오래된 기출 정리
npm run check:meta   빌드 결과의 title·description 중복, noindex, sitemap 검사
npx wrangler deploy --dry-run   Cloudflare 배포 묶음 확인 (실제 배포는 push 하면 자동)
```
