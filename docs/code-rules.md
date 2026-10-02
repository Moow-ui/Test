# 코드 규칙

## 1. 확장 구조 (자격증 수백 개 대비)

- **자격증 이름·slug 로 분기하는 `if` 금지.** 자격증마다 다른 점은 `meta.json` 값으로 처리한다 (`examInfo.choiceCount`, `passCriteria` 등).
- **모든 자격증은 공통 컴포넌트 + 동적 경로 하나**(`app/[lang]/…/cert/[slug]/`)로 처리한다. 자격증 전용 페이지·컴포넌트를 만들지 않는다.
- **데이터를 읽는 코드는 `lib/data/` 에만 둔다.**

| 파일 | 역할 |
|---|---|
| `lib/data/index.ts` | 서버·빌드용 읽기 함수 (`getCertList`, `getCertification`, `getQuestions` …) |
| `lib/data/store.ts` | 저장 방식과의 경계 (`DataStore`: `list`, `readJson`) |
| `lib/data/fs-store.ts` | 지금의 저장 방식: `/data` 폴더의 파일 |
| `lib/data/paths.ts` | 폴더·파일·문제 id·배포 주소 규칙 (문자열만, `fs` 없음) |
| `lib/data/client.ts` | 브라우저에서 문제 불러오기 (`useQuestionPool`, `useQuestions`, `fetchQuestions`) |
| `lib/data/validate.ts` | 전체 데이터 검사 (`npm run validate`) |

- 나중에 D1·R2 로 옮길 때는 `DataStore` 를 하나 더 만들어 `lib/data/index.ts` 의 `store` 한 줄만 바꾼다. 읽기 함수는 처음부터 전부 `async` 다.
- 테스트에도 자격증 목록·개수를 적지 않는다 (`tests/data.test.ts` 는 data 폴더에서 목록을 읽는다).

### Cloudflare 제한 대비

- **문제 데이터를 Worker 코드 묶음에 넣지 않는다.** Worker 는 코드 크기 제한이 있어 자격증이 쌓이면 배포가 막힌다.
  - 화면·서버 코드에서 문제 JSON 을 `import` 하지 않는다.
  - `next.config.ts` 의 `outputFileTracingExcludes` 가 `data/` 를 서버 묶음에서 뺀다. 이 설정을 지우지 않는다.
- 문제는 빌드 때 `scripts/build-data.ts` 가 **정적 파일(Static Assets)** 로 내보낸다 (`public/data/`, 주소는 `/data/…`).
  - `/data/{slug}/pool.json` — 문제 목록 (id·과목·단원·난이도만 담은 가벼운 파일)
  - `/data/{slug}/questions/{단원 파일}.json` — 단원별 문제
  - 브라우저는 목록으로 먼저 문제를 뽑고, **뽑힌 문제가 들어 있는 단원 파일만** 받는다.
- **첫 화면과 검색에는 요약 인덱스만** 쓴다 (`getCertList`: 이름·분류·시행기관·문제 수).
- 모든 페이지는 빌드 때 만들어지는 정적 페이지다. 실행 중(요청 시)에는 파일을 읽을 수 없으므로 새 페이지도 반드시 `generateStaticParams` + `dynamicParams = false` 로 미리 만든다.
  - `generateStaticParams` 는 `lib/static-params.ts` 의 함수를 쓴다. 어느 한 언어에서 빈 목록을 돌려주면 Next.js 가 그 화면 전체를 미리 만들지 않는다.

### 배포

- Cloudflare 의 배포 명령 `npx wrangler deploy` 는 OpenNext 프로젝트를 발견하면 곧바로 `opennextjs-cloudflare deploy` 를 부르고, 이 명령은 이미 빌드된 `.open-next` 가 있어야 한다.
  그래서 설치 직후(`postinstall`) `scripts/ci-build.mjs` 가 Cloudflare 빌드 환경(`WORKERS_CI`)에서만 `opennextjs-cloudflare build` 를 실행한다. **이 스크립트를 지우면 배포가 실패한다.**
- 빌드는 `npm run build` 를 거치므로 `prebuild`(검사 + 정적 문제 파일 만들기)가 항상 먼저 실행된다. 검사에 실패하면 배포가 중단된다.
- `wrangler.jsonc` 에는 build 명령을 두지 않는다 (두 번 빌드하게 된다). 내 컴퓨터에서 직접 올릴 때는 `npm run deploy`.
- 개발 서버가 켜져 있으면 `.open-next` 폴더를 잡고 있어 배포용 빌드가 실패한다. 끄고 실행한다.
- 회원 DB: D1 (`wrangler.jsonc` 의 `DB` 바인딩, `database_id` 없이 자동 생성). 표는 `lib/server/db.ts` 가 처음 쓸 때 만든다. `npm run dev` 에서는 `.wrangler` 폴더의 로컬 DB.

## 2. 다국어 (나라별 사이트)

번역이 아니라 **나라별 별도 콘텐츠**다. 화면 틀과 문구만 두 언어로 있고, 자격증·문제는 나라마다 따로 만든다.

- **브랜드명·도메인은 `config/brand.ts` 한 곳에만.** 다른 파일(문구 파일 포함)에 사이트 이름을 직접 쓰지 않는다 (`{brand}` 로 받는다).
  저장소 키·쿠키·DB 이름의 `qpass` 는 기존 사용자 기록 때문에 바꾸지 않는다.
- **화면 문구는 `messages/ko.json`, `messages/en.json`** 에만. 두 파일의 키 구성과 `{변수}` 는 같아야 한다.
  - `app/`, `components/` 에 문구를 직접 쓰지 않는다 (`tests/i18n.test.ts` 가 검사).
  - 서버 컴포넌트는 `getMessages(locale)`, 클라이언트 컴포넌트는 `useMessages()`. 변수는 `fmt("{n}문제", { n })`.
  - 긴 설명 문장 대신 짧은 라벨.
- **주소**: 모든 화면은 `app/[lang]/` 아래. 링크는 `localePath(locale, "/cert/…")` 로 만든다.
  - 예전 주소(`/cert/…`, `/notes`, `/profile`)는 `next.config.ts` 의 `redirects` 가 `/ko/…` 로 301.
  - 관리자 화면 `/admin` 만 언어 경로 밖에 있다 (5-1 참고).
- **언어 감지는 루트(`/`)에서만** (`app/route.ts`): 쿠키(`NEXT_LOCALE`) → 브라우저 언어 → 모르면 `/en`.
  그 밖의 주소에서는 옮기지 않고 맨 위에 한 줄 안내만 띄운다 (`components/i18n/LocaleBanner.tsx`).
- **자격증의 나라**: `/ko` 에는 KR, `/en` 에는 US 만 (`getCertList(country)`, `getCertificationIn(country, id)`). 다른 나라 자격증 주소는 404.
- **hreflang**(`ko`, `en`, `x-default`)은 모든 페이지에 (`lib/seo.ts` 의 `languageAlternates`).
  두 언어에 다 있는 화면(홈·오답노트·내 정보)은 서로를, 자격증 화면은 자기 자신(+다른 언어는 그 언어의 홈)을 가리킨다.
- **sitemap 은 언어별**: `/sitemaps/ko.xml`, `/sitemaps/en.xml` (목록은 `/sitemap.xml`, `lib/sitemap.ts`).
- API 오류는 문장이 아니라 코드(`wrong_credentials` 등)로 돌려주고, 화면이 `messages` 의 `errors` 로 바꿔 보여 준다.

## 3. 화면

타겟: 40~50대 현장 근무자. 사무실 PC나 휴대폰으로 쉬는 시간 5~10분씩. 컴퓨터에 익숙하지 않을 수 있다.

- PC와 모바일 **동등**. 1366×768 PC와 375px 모바일에서 문제+선지가 스크롤 없이 보여야 한다.
- 기본 글자 18px. 상단에 글씨 크기 3단계 버튼이 항상 보인다.
- 명도 대비를 높게. 글자색은 `ink`, `ink-sub` 두 가지만 (연회색 금지).
- 아이콘만 있는 버튼 금지. 항상 글자를 함께 ("다음 ▶").
- transition·animation 을 새로 넣지 않는다 (저사양 PC).
- 색은 `app/globals.css` 의 변수만. 상단 메뉴는 남색(`header`), 초급·중급·고급은 청록·파랑·보라(`lv1`~`lv3`, 연한 바탕은 `-soft`). 제목은 가운데.
- 웹폰트는 Pretendard. 처음 방문한 화면은 기기 글꼴로 그리고 다음 화면부터 적용 (`components/FontLoader.tsx`).
- 화면 밖의 긴 묶음에는 `cv` 클래스(content-visibility). 인쇄 화면(오답노트)에는 붙이지 않는다.
- `.btn`, `.card`, `.link` 는 `@layer components`. 같은 요소에 Tailwind 유틸리티를 붙이면 유틸리티가 이긴다.
- 로그인하지 않아도 모든 기능을 쓸 수 있어야 한다. 문제 수 기본값은 5문제.

### 본론만 보이게 (사용자 결정)

글자는 최대한 숨겨 두고 눌러야 보이게 한다. 설명 문장을 늘어놓지 않는다.

- **홈**: 제목 + 자격증 이름 검색(초성 가능) + 목록. 등급·분야 필터는 두지 않는다.
- **자격증 화면** (`components/cert/CertBoxes.tsx`). H1 은 "{이름} 합격 문제 풀기".
  - 큰 박스 3개(초급/중급/고급, 아래에 "보기 2개/3개/4개") → 누르면 범위 → 문제 수 → **[시험 시작하기]**
  - 그 아래: 실전 문제풀이 → 접힌 묶음 2개(시험 정보, 출제 분석)
  - 출제 경향 요약·소개·FAQ 는 맨 아래에 작게 접어 둔다 (`<details>`, HTML 에는 유지)
- **결과 화면** (`components/quiz/ResultView.tsx`): 점수 → 과목별 정답률 → 틀린 핵심 개념 → 약한 단원 → 버튼 → 문제별 결과.
  - 맨 위 왼쪽에 사이트 이름(`ResultHeader`, 누르면 메인). 풀이 중인 시험 화면에는 두지 않는다.
  - **오답노트는 채점·제출하는 순간 자동 저장** (`lib/storage.ts` 의 `addWrongNotes`). 답을 골라서 틀린 문제만 담고 안 푼 문제는 담지 않는다 (채점은 안 푼 문제도 오답). 버튼의 개수는 담긴 개수와 같다.
- **내 정보** (`components/profile/`): 로그인 전에는 로그인·회원가입 폼. 로그인하면 이름·칭호·요약 수치만 보이고 나머지는 접혀 있다.
- **출제 분석** (`components/cert/AnalysisPanel.tsx`): 과목을 가로로, 단원은 "1단원 : 직류회로". 막대 그래프 없이 ★ 와 %.
- **시험 화면** (`components/exam/ExamScreen.tsx`, 연습 풀이·실전 문제풀이 공용): 큐넷 CBT 와 같은 배열.
  - 위: 종목명·문제 수(CBT 는 남은 시간)·글자크기 100/150/200% / 가운데: 문제+보기, 오른쪽: 답안 표기란
  - 아래: 이전·다음·**바로 답 확인하기**(연습만, 기본 켜짐)·안 푼 문제·채점하기
  - 제출 확인창은 화면 가운데에 띄운다 (아래 고정 버튼 줄 뒤에 그리면 가려진다). 실전 문제풀이 는 다 풀어도 한 번 묻고, 연습 풀이는 다 풀었으면 바로 채점. 안 푼 문제 목록은 버튼 줄 바로 위.
  - 체크가 켜져 있으면 고르는 즉시 채점하고 답을 잠근다. 꺼져 있으면 마지막에 한꺼번에 채점한다.
  - 문제 위에 출처: "AI 예상문제 · 검수 전". 해설·오류 신고는 눌러야 펼쳐진다.
  - 상단 메뉴·하단 안내 없음 (`app/[lang]/(exam)/layout.tsx`). 키보드: 숫자 키(보이는 보기 번호) 선택, Enter/→ 다음, ← 이전.
- **광고 자리**: `components/AdSlot.tsx` 로 자리만 (지금은 아무것도 그리지 않음). 선지·다음 버튼과 붙이지 않고, 시험 화면에는 넣지 않는다.

## 4. 출제 규칙

### 난이도 (`lib/quiz-engine.ts` 의 `LEVEL_RULES`)

| 박스 | 포함 level | 보여 주는 선지 수 | levelLock 문제 |
|---|---|---|---|
| 초급 | basic | 2개 | 제외 |
| 중급 | basic + intermediate | 3개 | 제외 |
| 고급 | intermediate + advanced | 4개 | 포함 (선지 모두) |
| 실전 문제풀이 | 전체 | 시험의 실제 선지 수 (`examInfo.choiceCount`) | 포함 |

- **선지 수** (`lib/choices.ts` 의 `visibleChoices`, 수는 `lib/schemas.ts` 의 `LEVEL_CHOICE_COUNT`):
  남길 선지는 문제 데이터의 `choicesByLevel` 에 적혀 있다 (정답 + 가장 그럴듯한 오답). **화면에서 무작위로 빼지 않는다.**
  - 선지를 줄이는 것은 난이도 박스로 시작한 풀이뿐이다. 단원 풀기·오답노트·틀린 문제 다시 풀기·실전 문제풀이 는 모두 보여 준다.
  - 화면의 보기 번호는 보이는 순서(1, 2, 3…)이고, **저장하는 답은 원래 선지 번호**다 (`ExamScreen` 이 바꿔 준다).
    그래서 채점·오답노트·풀이 기록 코드는 선지 수를 몰라도 된다.
- **실전 문제풀이 는 실제 시험과 같아야 한다**: 전체 문항 수·과목별 문항 수·선지 수·제한 시간·화면 배치.
  문제가 모자란 자격증(`mockExamShortage`)은 줄여서 내지 않고 "문제 준비 중"으로 막는다.
- 문제 수는 5/10/20/30. 보유 문제가 모자란 버튼은 비활성화.
- `pastOnly`·`pastRatio` 는 코드에 남아 있지만 쓰지 않는다 (기출을 싣지 않는다).
- `retired` 문제는 새로 출제되지 않는다.

### 뽑는 방법

1. 과목별 문제 수 = 요청 수 × (과목 questionCount 비율), 최대 잔여법
2. 단원별 문제 수 = 과목 문제 수 × (단원 examWeight × 중요도 가중치 `IMPORTANCE_BOOST`), 최대 잔여법
   - 중요도 가중치는 연습 풀이에만. 실전 문제풀이 는 실제 출제 비중 그대로.
3. 과목에 배정된 수가 단원 수보다 적으면 중요도 높은 단원부터 1문제씩
4. 단원 안에서는 매번 무작위. 세션 내 중복 금지, 최근 7일 안에 푼 문제는 후순위
5. 단원에 문제가 모자라면 같은 과목 다른 단원 → 다른 과목에서 보충

엔진은 문제 내용을 보지 않고 id·과목·단원·난이도·출처만 쓴다 (`QuestionKey`). 그래서 가벼운 문제 목록만으로 뽑을 수 있다.

### 중요도 ★ / 합격 가능성 % (`lib/scoring.ts` 에만. 계수는 `SCORING`)

- ★ = round(0.6 × 단원 importance + 0.4 × 문제 frequency), 1~5
- 합격 가능성 % = 50 + (★ − 1) × 10 + (frequency ≥ 4 ? 5 : 0), 최대 95
- 화면 문구는 "이 문제를 맞혔다면 합격 가능성은? N%". 계산 방식 설명은 화면에 넣지 않는다 (사용자 결정).

### 합격 판정 (`lib/grading.ts`)

- 과락 없음(`subjectMinScore: null`): 전체 정답률 ≥ `averageScore`
- 과락 있음: 과목 평균 ≥ `averageScore` **그리고** 모든 과목 ≥ `subjectMinScore`

## 5. 로그인·개인정보

- 받는 정보는 **아이디·비밀번호·닉네임**뿐 (그래서 비밀번호 찾기가 없다).
- 비밀번호는 PBKDF2-SHA256(소금 포함) 해시만 저장. 세션 토큰도 DB 에는 해시로만, 쿠키는 HttpOnly·SameSite=Lax.
- 상태를 바꾸는 API 는 `isSameOrigin` 으로 다른 사이트의 요청을 막는다. 로그인 5회 연속 실패 시 5분 잠금.
- 비밀번호·세션 토큰을 로그나 응답에 남기지 않는다.
- 풀이 기록은 localStorage 가 기준이고 로그인하면 계정(DB)과 맞춘다 (`lib/sync-merge.ts` 의 `SYNC_FIELDS`: 풀이 기록, 점수 기록, 오답노트, 보유 자격증).
  - 로그인 직후에만 이 기기의 기록과 계정 기록을 **합치고**, 그 뒤에는 계정 기록으로 **바꾼다**.
  - 로그아웃하면 이 기기의 기록을 지운다. 회원 탈퇴는 계정과 기록을 모두 지운다.
- 화면은 `lib/storage.ts` 의 값만 읽는다. 서버와 맞추는 일은 `components/auth/SyncManager.tsx`.
- 기록은 **문제 id** 로 저장된다. 그래서 문제 id 를 바꾸면 안 된다 ([data-rules.md](data-rules.md)).

### 5-1. 관리자 화면 (`/admin`)

- 회원 수, 오늘·이번 주 가입자(한국 시간), 회원 목록, 문제 오류 신고 목록. 비밀번호 해시·소금은 조회하지 않는다 (`lib/server/admin.ts`).
- **코드에 관리자 비밀번호를 만들지 않는다.** 잠금은 Cloudflare Access(Zero Trust)가 하고, 서버는 Access 가 붙여 주는 토큰(`Cf-Access-Jwt-Assertion`)의 서명·발급자·AUD·기간을 직접 검증한다 (`lib/server/access.ts`).
  - Access 를 거치지 않은 요청(workers.dev 주소 등)은 `/admin`, `/api/admin/…` 모두 404.
  - 설정값 `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` 는 Cloudflare 대시보드의 Worker 변수에 넣는다 (`wrangler.jsonc` 의 `keep_vars` 가 배포 때 지워지지 않게 한다). 없으면 아무도 못 들어온다.
  - 개발 서버(`npm run dev`)에서만 검사를 건너뛴다.
- 관리자 API 를 새로 만들면 맨 처음에 `getAdminIdentity(request.headers)` 를 확인한다.
- `/admin` 은 요청할 때마다 그리는 유일한 화면이다 (`force-dynamic`). 언어 경로 밖에 있어 자기 `layout.tsx` 를 가진다.
- 문제 오류 신고는 `POST /api/reports` 로 D1 의 `reports` 표에 쌓인다 (로그인 불필요, 보낸 사람은 저장하지 않음, 입력 규칙은 `lib/report-rules.ts`).
- 회원의 마지막 접속일(`users.last_seen_at`)은 로그인·가입 때와 `/api/auth/me` 에서 10분에 한 번 고친다.

## 6. SEO

- slug 는 영문 고정, 키워드는 title·H1·본문에. 페이지마다 title·description·H1 이 서로 달라야 한다 (`lib/seo.ts`, 문구 틀은 `messages` 의 `seo`).
  - 메인: "{이름} 필기 예상문제·출제경향 | 자격증달인"
  - 기출 유형: "{이름} 기출 유형 문제 무료 풀이 + 해설 | 자격증달인"
  - 단원: "{이름} {단원명} 핵심정리·예상문제 | 자격증달인"
- `/past` 와 단원 페이지는 대표 문제(최대 10개)를 정답·해설까지 서버 렌더링한다.
- 시험 화면·오답노트·"준비 중" 자격증 페이지는 `noindex` 이고 sitemap 에서 뺀다.
- 접어 둔 내용(`<details>`)도 HTML 에는 그대로. 키워드 나열·숨김 텍스트 금지.
- 빌드 후 `npm run check:meta` 로 title·description 중복, noindex/sitemap, hreflang·`<html lang>`·브랜드명 검사.
