@AGENTS.md

# 자격증달인 / ExamPasso — 프로젝트 규칙 (요약)

한 줄 소개: **"세상의 모든 자격증. 5분 문제 연습하기."**
흐름: 자격증 선택 → 초급/중급/고급 → 실제 CBT 와 같은 화면에서 풀이 → 채점·해설

이 파일은 요약이다. 작업에 필요한 문서만 열어 본다.

| 할 일 | 문서 |
|---|---|
| 자격증 추가, 문제 추가·수정 | [docs/add-cert.md](docs/add-cert.md) |
| 데이터 폴더·스키마·문제 id·콘텐츠 정책 | [docs/data-rules.md](docs/data-rules.md) |
| 코드 구조, 화면·다국어·출제·SEO·로그인·배포 규칙 | [docs/code-rules.md](docs/code-rules.md) |

## 기본

- 저장소: https://github.com/Moow-ui/Test (`main`). 작업을 마치면 커밋하고 push 한다. push 하면 Cloudflare Workers 에 자동 배포된다.
- 도메인은 `exampasso.com` 하나. `/ko` = 자격증달인(한국 자격증), `/en` = ExamPasso(미국 자격증). 번역이 아니라 나라별 별도 콘텐츠다.
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + zod + vitest, Cloudflare Workers + OpenNext, 회원 DB 는 D1.
- Next.js 16 은 예전과 다르다. 코드를 쓰기 전에 `node_modules/next/dist/docs/` 를 확인한다.
- 타겟: 40~50대 현장 근무자. 쉬는 시간 5~10분, PC·모바일 동등, 큰 글자, 높은 대비, 글자가 있는 버튼, 애니메이션 없음.
- 로그인 없이 모든 기능을 쓸 수 있어야 한다.

## 가장 중요한 규칙 5가지

1. **자격증 추가 = 데이터 폴더 하나 추가.** `data/certs/{country}/{slug}/` 만 만들면 목록·검색·sitemap·화면이 자동으로 생긴다.
   자격증 때문에 코드를 고치지 않는다. 손으로 고치는 자격증 목록은 없다.
2. **자격증 이름·slug 로 분기하는 코드 금지.** 자격증마다 다른 점은 전부 `meta.json` 값으로 처리한다 (선지 수, 합격 기준 등).
   선지 수는 초급 2개·중급 3개·고급 4개·실전 문제풀이 는 시험 그대로. 남길 선지는 문제의 `choicesByLevel` 에 미리 적고, 줄일 수 없는 문제는 `levelLock`.
3. **문제 id 는 영구적이다.** `{slug}-{chapterId}-{4자리 번호}`. 바꾸지도 다시 쓰지도 않는다.
   문제를 고치면 `version` 만 올리고, 없앨 때는 지우지 말고 `retired: true`. (회원의 오답노트·풀이 기록이 id 를 가리킨다)
4. **문제 데이터를 Worker 코드에 넣지 않는다.** 화면 코드에서 문제 JSON 을 `import` 하지 않는다.
   문제는 빌드 때 정적 파일(`public/data`)로 내보내고, 브라우저가 필요한 단원 파일만 받는다.
5. **데이터를 읽는 코드는 `lib/data/` 에만 둔다.** 화면 코드에서 `fs`, `localStorage`, `/data` 를 직접 건드리지 않는다.

## 데이터 폴더

```
data/certs/{country}/{slug}/
  meta.json                   자격증 정보 (시행기관, 시험 구성, 선지 수, 합격 기준, 출처)
  chapters.json               과목·단원·중요도·출제 비중
  questions/{chapterId}.json  단원별 문제 (파일당 최대 300문항, 넘으면 -2, -3)
  exams/{year}-{round}.json   실전 모의고사 구성
  assets/                     문제 그림
data/cert-queue.json          추가할 자격증 대기 목록
data/review-queue/            검수 대기 목록
reports/{YYYY-MM}/            작업 리포트 (월별 폴더)
```

"준비 중" 자격증 = `meta.json` 만 있는 폴더 (문제가 생기면 자동으로 풀 수 있게 된다).

## 코드 지도

```
config/brand.ts            ★ 브랜드명(언어별)·도메인
messages/{ko,en}.json      ★ 화면 문구 (app/, components/ 에 문구를 직접 쓰지 않는다)
content/pages/{ko,en}.ts   안내 페이지 본문 (소개·문의·개인정보처리방침·이용약관·면책 고지)
app/[lang]/                모든 화면. 자격증은 동적 경로 하나(cert/[slug])와 공통 컴포넌트로 처리
lib/data/                  ★ 데이터 읽기 (index: 서버·빌드 / client: 브라우저 / paths: 폴더 규칙 / validate: 검사)
lib/schemas.ts             데이터 스키마 (zod)
lib/quiz-engine.ts         출제 알고리즘 · lib/scoring.ts ★·합격 가능성 · lib/grading.ts 채점
lib/choices.ts             난이도별로 보여 줄 선지 (초급 2 · 중급 3 · 고급 4 · 실전 문제풀이 는 시험 그대로)
lib/storage.ts             ★ localStorage 는 여기 한 곳
lib/server/                D1, 세션, 비밀번호 해시
scripts/                   validate-data, build-data, import-questions, convert-choices, check-meta, ci-build
```

## 콘텐츠 정책 (요약)

- **모든 문제는 직접 만든 AI 예상문제다.** 기출 원문을 싣거나 지어내지 않는다. `source: "predicted"`, `reviewStatus: "unverified"`.
- 해설은 "핵심 설명(계산은 번호 목록) + **틀린 선지** 목록" 형식. 50대가 이해할 수 있는 쉬운 말로.
- 받는 개인정보는 아이디·비밀번호·닉네임뿐이다.

## 작업 순서

- 데이터를 고친 뒤: `npm run validate` → `npm test`
- 코드를 고친 뒤: `npm test` → `npm run build` → (화면이 바뀌면) 브라우저에서 확인
- **자격증 1개 추가 = 커밋 1개**, 메시지는 `cert: add {slug}`. 문제가 생기면 그 커밋만 되돌린다.
- 개발 서버가 켜져 있으면 배포용 빌드(`opennextjs-cloudflare build`)가 실패한다. 끄고 실행한다.

## 명령어

```
npm run dev            개발 서버 (시작할 때 정적 문제 파일을 다시 만든다)
npm run build          빌드 (앞에서 validate + build:data 가 자동 실행. 검사에 실패하면 중단)
npm test               단위 테스트
npm run validate       /data 전체 검사 (스키마, id 중복·형식, 정답 번호, 선지 수, 필수 필드)
npm run build:data     data/ → public/data/ 정적 문제 파일 만들기
npm run questions:add  문제 넣기·고치기 (CSV/JSON → 검증 → 단원별 파일, id 자동)
npm run choices:convert  값이 없는 문제에 choicesByLevel·levelLock 채우기 (난이도별 선지 수)
npm run check:meta     빌드 결과의 title·description 중복, noindex, sitemap, hreflang 검사
npx wrangler deploy --dry-run   Cloudflare 배포 묶음 확인 (실제 배포는 push 하면 자동)
```
