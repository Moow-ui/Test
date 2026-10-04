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
- **첫 화면과 검색에는 요약 인덱스만** 쓴다 (`getCertList`: 이름·분야·자격 종류·시행기관·문제 수).
- 모든 페이지는 빌드 때 만들어지는 정적 페이지다. 실행 중(요청 시)에는 파일을 읽을 수 없으므로 새 페이지도 반드시 `generateStaticParams` + `dynamicParams = false` 로 미리 만든다.
  - `generateStaticParams` 는 `lib/static-params.ts` 의 함수를 쓴다. 어느 한 언어에서 빈 목록을 돌려주면 Next.js 가 그 화면 전체를 미리 만들지 않는다.

### 배포

- Cloudflare 의 배포 명령 `npx wrangler deploy` 는 OpenNext 프로젝트를 발견하면 곧바로 `opennextjs-cloudflare deploy` 를 부르고, 이 명령은 이미 빌드된 `.open-next` 가 있어야 한다.
  그래서 설치 직후(`postinstall`) `scripts/ci-build.mjs` 가 Cloudflare 빌드 환경(`WORKERS_CI`)에서만 `opennextjs-cloudflare build` 를 실행한다. **이 스크립트를 지우면 배포가 실패한다.**
- 빌드는 `npm run build` 를 거치므로 `prebuild`(검사 + 정적 문제 파일 만들기)가 항상 먼저 실행된다. 검사에 실패하면 배포가 중단된다.
- `wrangler.jsonc` 에는 build 명령을 두지 않는다 (두 번 빌드하게 된다). 내 컴퓨터에서 직접 올릴 때는 `npm run deploy`.
- 개발 서버가 켜져 있으면 `.open-next` 폴더를 잡고 있어 배포용 빌드가 실패한다. 끄고 실행한다.
- 회원 DB: D1 (`wrangler.jsonc` 의 `DB` 바인딩, `database_id` 없이 자동 생성). 표는 `lib/server/db.ts` 가 처음 쓸 때 만든다. `npm run dev` 에서는 `.wrangler` 폴더의 로컬 DB.
- Worker 시작 파일은 `custom-worker.ts` 다 (`wrangler.jsonc` 의 `main`). 사이트는 `.open-next/worker.js` 가 그대로 처리하고, 여기서는 정기 작업만 덧붙인다.

### IndexNow (Bing·네이버 등에 새·바뀐 페이지 알리기)

- 키와 제출 주소는 `config/indexnow.ts` 한 곳. 키 파일 `public/{키}.txt` 는 빌드 때 `scripts/build-indexnow-key.ts` 가 만든다 (git 에 올리지 않는다).
- 매시 정각 정기 작업(`wrangler.jsonc` 의 `triggers.crons`)이 sitemap 을 직전 목록(D1 `indexnow_state`)과 비교해,
  새로 생기거나 `lastmod` 가 바뀐 주소만 `api.indexnow.org` 와 네이버(`searchadvisor.naver.com/indexnow`)에 낸다. 첫 실행 때만 전체. 바뀐 게 없으면 내지 않는다.
- 배포와 따로 돌므로 실패해도 배포·루틴은 실패하지 않는다. 실패하면 다음 회차에 다시 내고, 같은 변경분이 3번 실패하면 포기한다.
- 기록은 D1 `indexnow_log`. 확인 주소 `/api/indexnow` (최근 20건, 날짜·주소 수·응답 코드만, 5분 캐시, noindex + robots.txt 차단).
- 자격증을 추가할 때 따로 할 일은 없다 (sitemap 에 들어가면 다음 정각에 자동 제출). 구글은 IndexNow 를 쓰지 않는다.

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
- 기본 글자 18px (본문 최소 16px). 모든 화면 상단 막대 오른쪽에 같은 모양의 글자 크기 3단계("가 가 가", 18·22·26px) + 어둡게/밝게 버튼 (`components/TopBar.tsx`, `DisplayControls.tsx`). 고른 값은 저장되어 모든 화면에서 유지되고, 테마는 처음엔 기기 설정을 따른다.
- 명도 대비를 높게. 글자색은 `ink`, `ink-sub` 두 가지만 (연회색 금지).
- 아이콘만 있는 버튼 금지. 항상 글자를 함께 ("다음 ▶").
- transition·animation 을 새로 넣지 않는다 (저사양 PC).
- **디자인 토큰은 `app/tokens.css` 한 파일** (P12): 글자 크기 5단계(`text-sm` 16 · `text-base` 18 · `text-lg` 22 · `text-xl` 28 · `text-2xl` 40px), 굵기 2종(`font-normal`·`font-bold`),
  간격 8px 단위(간격 1칸 = 4px, 짝수 칸만), 색은 브랜드 주황(`primary` 버튼 바탕 · `accent` 글자·링크 · `primary-soft` 넓은 면, P15) + 정답 초록(`ok`) + 오답 빨강(`bad`) + 회색 계열 + 난이도 4색(`lv-basic` 초록 · `lv-mid` 파랑 · `lv-adv` 보라 · `lv-cbt` 먹색), 모서리 2종(`rounded-lg` 8px · `rounded-2xl` 16px).
  `text-[15px]` 같은 임의 값·새 색 코드를 쓰지 않는다. 상자(`.card`·목록 카드·난이도 박스)는 1px 테두리(`card-line`) + 아주 옅은 그림자(`shadow-card`, 다크는 없음)로 바탕과 구분하고 상자 안에 상자를 넣지 않는다 (P15).
  색 값은 `app/tokens.css` 에서만 바꾼다. 라이트·다크 대비는 `tests/contrast.test.ts` 가 자동 검사한다 (글자 4.5:1, 테두리·표시 3:1).
  로고 마크(초승달 + 체크)는 `components/LogoMark.tsx`, 파비콘은 `app/icon.svg` (같은 모양). 되돌리기 백업: git 태그 `backup/pre-p15`. 버튼은 `.btn`(회색) 한 모양, 주 버튼(`.btn-primary`)은 한 묶음에 1개.
  되돌리기 백업: git 태그 `backup/pre-p12`.
- 웹폰트는 Pretendard. 처음 방문한 화면은 기기 글꼴로 그리고 다음 화면부터 적용 (`components/FontLoader.tsx`).
- 화면 밖의 긴 묶음에는 `cv` 클래스(content-visibility). 인쇄 화면(오답노트)에는 붙이지 않는다.
- `.btn`, `.card`, `.link` 는 `@layer components`. 같은 요소에 Tailwind 유틸리티를 붙이면 유틸리티가 이긴다.
- 로그인하지 않아도 모든 기능을 쓸 수 있어야 한다. 문제 수 기본값은 5문제.

### 본론만 보이게 (사용자 결정)

글자는 최대한 숨겨 두고 눌러야 보이게 한다. 설명 문장을 늘어놓지 않는다.

- **홈** (P13): 제목("세상의 모든 자격증. / 5분 문제 연습하기.") → 큰 검색창(`components/home/CertSearch.tsx`, 높이 64px, 자동완성: 초성·띄어쓰기 무시·줄임말, 결과 없으면 "아직 없는 자격증이에요")
  → 최근 공부한 자격증 상자(`QuickStart`: 바로 5문제·이어서 풀기). 기록이 없는 첫 방문이면 이 상자는 없다 ("많이 찾는 자격증" 상자는 사용자 결정 2026-10-04 로 삭제)
  - 검색창 바로 아래 **오늘의 1문제** (`components/home/DailyQuestion.tsx`, P15): 그 자리에서 풀고 정답·해설을 본다. 날짜(나라 시간대)마다 한 문제로 고정.
    빌드 때 `scripts/build-data.ts` 가 나라별 366일 일정표 `/data/daily/{kr,us}.json` 을 만든다 (`lib/daily.ts`: 검수 완료·출제 중·그림 없는 문제, 자격증을 돌아가며). 출처 배지는 시험 화면과 같다.
  → 맨 아래 "전체 자격증 목록" (`components/home/CertGrid.tsx`, P15): 카드 격자(이름 + 등급, 개념 정리가 있으면 "개념" 배지, "준비 중"은 회색 카드). 카드 링크는 모두 서버 HTML 에 있다 (검색엔진 색인용).
    제목 오른쪽 [분류] 단추를 누르면 필터가 펼쳐진다: 분야(데이터에 있는 값) · 등급(`GRADE_FILTER_ORDER` 중 데이터에 있는 것 + 기타) · 준비된 것만. 필터는 주소에 남는다 (`?field=전기&grade=기사&ready=1`).
- **시행기관 표기**: 화면·푸터·안내 페이지에 특정 기관 이름을 적지 않는다. 자격증 페이지(메인·단원·기출 유형) 맨 아래의
  `components/cert/IssuerNotice.tsx` 가 그 자격증의 `issuer`·`trademarkNotice` 로 "시행기관과 관계 없음(not affiliated with)" 고지와 공식 사이트 링크를 그린다.
- **workers.dev 주소**: `next.config.ts` 가 `*.workers.dev` 로 들어온 요청을 `exampasso.com` 의 같은 경로로 301 이동시킨다.
- **자격증 화면** (`components/cert/CertBoxes.tsx`). H1 은 "{이름} 합격 문제 풀기".
  - 큰 박스 3개(초급/중급/고급, 아래에 "보기 2개/3개/4개") → 누르면 범위 → 문제 수 → **[시험 시작하기]**. 색은 초급 초록·중급 파랑·고급 보라, 실전 문제풀이는 먹색 (P15. 브랜드 주황과 헷갈리지 않게 실전은 주황 대신 먹색)
  - 그 아래: 개념 정리(검증 통과 단원)가 있는 자격증은 눈에 띄는 **"핵심 개념 정리" 카드**(→ `/concepts`), 없는 자격증은 얇은 한 줄 "단원별 핵심정리 먼저 보기"(출제 분석을 펼침). 개념 정리가 없으면 "개념 정리"라는 이름을 쓰지 않는다.
  - 그 아래: 실전 문제풀이 → 접힌 묶음 2개(시험 정보, 출제 분석)
  - 출제 경향 요약·소개·FAQ 는 맨 아래에 작게 접어 둔다 (`<details>`, HTML 에는 유지)
  - 순서(사용자 결정): 시험 정보·출제 분석 → **운영진 학습 팁**(`components/cert/StudyTips.tsx`, "운영진 작성" 표시) → 접어 둔 "더 알아보기"(출제 경향·소개·FAQ·**관련 자격증**) → **이용자 후기란**(`components/reviews/`, "이용자 작성" 표시) → 시행기관 고지.
    관련 자격증은 "더 알아보기" 안에 넣는다 ("준비 중" 자격증은 접을 내용이 없어 그대로 보여 준다).
    팁과 후기는 한 상자에 섞지 않는다. 후기란은 "준비 중" 자격증에도 나오고, 팁은 `meta.json` 에 `studyTips` 가 있을 때만 나온다.
- **결과 화면** (`components/quiz/ResultView.tsx`): 점수 → 과목별 정답률 → 틀린 핵심 개념 → 약한 단원 → 버튼 → 문제별 결과.
  - 버튼 줄의 "이 자격증 후기 남기기"는 자격증 페이지의 후기란(`#reviews`)으로 간다.
  - 맨 위 왼쪽에 사이트 이름(`ResultHeader`, 누르면 메인). 풀이 중인 시험 화면에는 두지 않는다.
  - **오답노트는 채점·제출하는 순간 자동 저장** (`lib/storage.ts` 의 `addWrongNotes`). 답을 골라서 틀린 문제만 담고 안 푼 문제는 담지 않는다 (채점은 안 푼 문제도 오답). 버튼의 개수는 담긴 개수와 같다.
- **내 정보** (`components/profile/`): 로그인 전에는 로그인·회원가입 폼. 로그인하면 이름·칭호·요약 수치만 보이고 나머지는 접혀 있다.
- **출제 분석** (`components/cert/AnalysisPanel.tsx`): 과목을 가로로, 단원은 "1단원 : 직류회로". 막대 그래프 없이 ★ 와 %.
- **시험 화면** (`components/exam/ExamScreen.tsx`, 연습 풀이·실전 문제풀이 공용): 실제 CBT 시험과 같은 배열.
  - 위: 다른 화면과 같은 상단 막대(왼쪽 나가기, 오른쪽 글자 크기) → 한 줄 "운전면허 학과시험 · 중급 · 3/5"(CBT 는 남은 시간) / 가운데: 문제+보기, 오른쪽: 답안 표기란
  - 아래: 이전·다음·**바로 답 확인하기**(연습만, 기본 켜짐)·안 푼 문제·채점하기
  - 제출 확인창은 화면 가운데에 띄운다 (아래 고정 버튼 줄 뒤에 그리면 가려진다). 실전 문제풀이 는 다 풀어도 한 번 묻고, 연습 풀이는 다 풀었으면 바로 채점. 안 푼 문제 목록은 버튼 줄 바로 위.
  - 체크가 켜져 있으면 고르는 즉시 채점하고 답을 잠근다. 꺼져 있으면 마지막에 한꺼번에 채점한다.
  - 문제 위에 출처: 검증을 통과한 문제(`reviewStatus: "verified"`)는 "예상문제 · 검수 완료" + ⓘ 버튼(누르면 "정답을 가린 별도 AI가…" 안내문), 검증 기록이 없으면 "예상문제 · 검수 전". 배지에는 "AI"를 쓰지 않는다(사용자 결정 2026-10-02). AI 로 만들었다는 사실은 ⓘ 안내문·사이트 하단 고지·면책 페이지에 적는다. 기출은 출처 표기만. 해설·오류 신고는 눌러야 펼쳐진다.
  - 상단 메뉴·하단 안내 없음 (`app/[lang]/(exam)/layout.tsx`). 키보드: 숫자 키(보이는 보기 번호) 선택, Enter/→ 다음, ← 이전.
- **광고 자리**: `components/AdSlot.tsx`. `NEXT_PUBLIC_ADSENSE_ID` 가 없으면 아무것도 그리지 않는다.
  자리는 **홈 목록 하단·결과 화면 하단 두 곳뿐**이다. 선지·다음 버튼과 붙이지 않고, 풀이 중인 시험 화면에는 넣지 않는다.
  `/ads.txt` 는 `scripts/build-ads-txt.ts` 가 빌드 때 만든다 (id 가 없으면 빈 파일).
- **안내 페이지** (소개·문의·개인정보처리방침·이용약관·면책 고지): 본문은 `content/pages/{ko,en}.ts`, 화면은 `app/[lang]/(site)/[page]/page.tsx` 하나.
  긴 글이고 나라마다 구성이 달라 `messages` 에 넣지 않는다. 사이트 이름·이메일은 `{brand}`, `{email}` 로 받는다. 글을 고치면 `INFO_UPDATED`(시행일)도 고친다.
  하단 안내(`Footer`)에 5개 링크가 모두 있고, 결과 화면에는 약관 링크만 작게 둔다.
- **쿠키 안내**: `/en` 은 화면 아래 배너(`components/CookieNotice.tsx`, 확인하면 다시 안 뜸), `/ko` 는 하단 안내의 한 줄.
- **내 데이터 삭제**: 로그인한 사람은 회원 탈퇴, 로그인하지 않은 사람은 내 정보 화면의 "이 기기의 기록 모두 지우기"(`clearDeviceRecords`). 둘 다 한 번 확인한다.
- **빌드 때 읽는 설정값**은 `lib/site.ts` 에 모은다: `CONTACT_EMAIL`, 소유확인(`GOOGLE_`·`NAVER_`·`BING_SITE_VERIFICATION`), `NEXT_PUBLIC_ADSENSE_ID`.
  모든 페이지가 정적이라 Cloudflare 의 **빌드 변수**에 넣고 다시 배포해야 반영된다.

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
- 화면은 탭 3개다 (`/admin`, `/admin?tab=reports`, `/admin?tab=reviews`): 회원 · 문제 오류 신고 · 후기.
  후기 탭에는 자격증별 후기 수, 최신 후기 목록, 숨기기·다시 보이기·삭제 버튼이 있다 (`POST /api/admin/reviews`).

### 5-2. 자격증 후기·활동 표시

- **후기는 이용자가 직접 쓴 것만 싣는다.** AI·운영진이 쓴 글을 후기로 넣지 않는다 (운영진 글은 학습 팁 상자에 "운영진 작성"으로).
- 입력: 별점 1~5, 한 줄 후기 10~300자, 상태(공부 중·합격·불합격), 닉네임. 로그인 없이 쓸 수 있고 로그인했으면 계정 닉네임을 쓴다. 규칙은 `lib/review-rules.ts` (서버·화면 공용).
- 저장: 회원 DB 와 같은 D1 의 `reviews`·`review_flags`·`quiz_activity` 표 (`lib/server/reviews.ts`). 회원 탈퇴 때 그 계정의 후기도 지운다.
- 모든 페이지가 정적이라 후기는 화면이 열린 뒤 `GET /api/reviews?cert=…` 로 받아 그린다 (최신순 10개 + 더 보기).
  평균 별점은 후기 5개 이상일 때만, "이번 주 이 자격증 문제 풀이 N회"는 20회 이상일 때만 응답에 들어 있다.
- **스팸 방지**: 같은 IP 하루 3개 + 링크·전화번호·금칙어 거부 + 신고 3회 자동 숨김. IP 는 저장하지 않고 날짜를 섞은 해시만 저장한다.
  - 사람 확인(Cloudflare Turnstile)은 쓰지 않는다 (사용자 결정, 2026-10-02: 실제 사이트에서 위젯이 뜨지 않아 뺐다).
- **신고**: 후기마다 신고 버튼. 서로 다른 3곳에서 신고하면 자동으로 숨긴다 (`hidden = 2`). 관리자가 다시 보이게 하면 쌓인 신고도 지운다.
- **활동 표시**: 풀이를 채점·제출할 때 `POST /api/activity` 가 자격증·주(한국 시간 월요일 시작) 단위 숫자만 1 올린다. 누가 풀었는지는 저장하지 않는다. 초깃값을 넣거나 숫자를 고치지 않는다.
- 후기·활동 API 는 빌드 때 만든 `/data/cert-ids.json` 으로 없는 자격증 id 를 걸러 낸다.
- **SEO**: 후기 글은 화면에 그대로 보이게 그리되, 별점 구조화 데이터(`Review`, `AggregateRating`)는 넣지 않는다.

## 6. SEO

- slug 는 영문 고정, 키워드는 title·H1·본문에. 페이지마다 title·description·H1 이 서로 달라야 한다 (`lib/seo.ts`, 문구 틀은 `messages` 의 `seo`).
  - 메인: "{이름} 필기 예상문제·출제경향 | 자격증달인"
  - 기출 유형: "{이름} 기출 유형 문제 무료 풀이 + 해설 | 자격증달인"
  - 단원: "{이름} {단원명} 핵심정리·예상문제 | 자격증달인"
- `/past` 와 단원 페이지는 대표 문제(최대 10개)를 정답·해설까지 서버 렌더링한다.
- **개념 정리** (P14): `/cert/{slug}/concepts` 제목 "{이름} 개념 정리 - 단원별 핵심 요약 | 자격증달인", 단원 `/cert/{slug}/concepts/{단원}`.
  canonical, BreadcrumbList·Article 구조화 데이터, sitemap 포함, 본문 서버 렌더링. 데이터는 `concepts.json`(검증 통과 단원만, data-rules.md 3-1).
  전체 페이지는 그 자격증의 **요약 노트** 한 권이다 (P16): 단원 목차(누르면 단원 페이지) → 과목별 노트, 단원마다 번호 제목(누르면 단원 페이지) · 개요(`summary`) · 핵심 정리(용어 형광펜 + 뜻) · ★ 시험 포인트 (`ConceptNote`).
  단원 페이지 맨 위에도 같은 개요가 나온다. 나중에 자격증별 요약 노트를 "자료실"로 모을 수 있다.
  출제 분석의 단원 이름은 개념 정리가 있으면 그 페이지로 가고, 그 단원 줄 끝에 [개념 보기] 단추가 붙는다 (P15). 자격증 페이지의 "핵심 개념 정리" 카드는 전체 페이지로 간다. 주소는 영문 `concepts` (slug 영문 고정 규칙).
- 시험 화면·오답노트·"준비 중" 자격증 페이지는 `noindex` 이고 sitemap 에서 뺀다.
- 접어 둔 내용(`<details>`)도 HTML 에는 그대로. 키워드 나열·숨김 텍스트 금지.
- 빌드 후 `npm run check:meta` 로 title·description 중복, noindex/sitemap, hreflang·`<html lang>`·브랜드명 검사.
