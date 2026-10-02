# 자격증달인 — 자격증 필기 AI 예상문제 풀이 사이트

> 세상의 모든 자격증. 5분 문제 연습하기.

자격증 선택 → 초급/중급/고급 선택 → 실제 CBT 와 같은 화면에서 풀이 → 채점·해설.
로그인하지 않아도 모든 문제를 풀 수 있고(기록은 그 브라우저에만 저장),
로그인하면 점수 기록·오답·오답노트·보유 자격증이 계정에 저장됩니다.

- 주소는 나라별로 나뉩니다: **`/ko` = 자격증달인(한국 자격증)**, **`/en` = ExamPasso(미국 자격증)**. 도메인은 `exampasso.com` 하나입니다.
  - `/` 로 들어오면 브라우저 언어에 따라 `/ko` 또는 `/en` 으로 보냅니다 (알 수 없으면 `/en`).
  - 사이트 이름을 바꾸려면 [config/brand.ts](config/brand.ts) 한 줄만 고치면 됩니다.
  - 화면 문구는 [messages/ko.json](messages/ko.json), [messages/en.json](messages/en.json) 에 있습니다.
- 기술: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · zod · vitest
- 저장소: https://github.com/Moow-ui/Test (브랜치 `main`) · 배포: Cloudflare Workers
- 현재 풀 수 있는 자격증: 한국 9종 (AI 예상문제 497개). 나머지는 "준비 중"
- 프로젝트 규칙(스택·스키마·계산 공식·콘텐츠 정책)은 [CLAUDE.md](CLAUDE.md) 에 있습니다.

---

## 1. 내 컴퓨터에서 실행하기

이 폴더에서 터미널(명령 프롬프트)을 열고 아래를 순서대로 실행합니다.

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 됩니다. 끝낼 때는 터미널에서 `Ctrl + C`.

## 2. 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발용으로 실행 (파일을 고치면 바로 반영) |
| `npm run build` | 빌드 (에러가 없어야 배포 가능) |
| `npm test` | 단위 테스트 |
| `npm run questions:add -- <파일> --cert <slug>` | **문제 넣기·고치기** (id 자동, 단원별 파일로 자동 분류) |
| `npm run build:data` | `data/` → `public/data/` 정적 문제 파일 만들기 (dev·build 앞에서 자동 실행) |
| `npm run validate` | `/data` 폴더 전체 검증 |
| `npm run check:meta` | 빌드 결과의 title·description 중복, noindex, sitemap 검사 |

## 3. 자격증 추가·문제 넣기

**자격증 추가 = 데이터 폴더 하나 추가**입니다. 코드는 고치지 않습니다.

```
data/certs/{country}/{slug}/
  meta.json                   자격증 정보 (시행기관 issuer, 자격 종류 certType, 시험 구성, 선지 수, 합격 기준, 출처)
  chapters.json               과목·단원·중요도·출제 비중
  questions/{chapterId}.json  단원별 문제 (파일당 최대 300문항)
```

- 순서와 주의할 점: [docs/add-cert.md](docs/add-cert.md)
- 필드 설명·문제 id 규칙·콘텐츠 정책: [docs/data-rules.md](docs/data-rules.md)
- 자격증 목록·검색·sitemap 은 빌드할 때 이 폴더를 읽어 자동으로 만듭니다.
- **모든 문제는 직접 만든 AI 예상문제입니다. 기출 원문은 넣지 않습니다.**
- 자격증 1개를 추가할 때마다 커밋 1개(`cert: add {slug}`)로 올립니다. 문제가 생기면 그 커밋만 되돌리면 됩니다.

## 4. 조정할 수 있는 값

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 초급·중급·고급 구성, 기출:예상 비율, 문제 수 버튼 | `lib/quiz-engine.ts` 의 `LEVEL_RULES`, `QUIZ_COUNTS` |
| 중요 단원 가중치 | `lib/quiz-engine.ts` 의 `IMPORTANCE_BOOST` |
| 기출 수록 기간(10년), 정답률 → 난이도 기준 | `lib/past.ts` |
| 중요도 ★·합격 가능성 % 공식의 계수 | `lib/scoring.ts` 의 `SCORING` |
| 시험 화면 글자 크기(100·150·200%) | `lib/storage.ts` 의 `EXAM_ZOOMS` |
| 페이지 제목·설명 문구 규칙 | `lib/seo.ts` |
| 사이트 이름·한 줄 소개·하단 고지 문구 | `lib/site.ts` |
| 자격증 노출 순서 | 각 자격증 `meta.json` 의 `order` (작을수록 먼저. 문제가 준비된 자격증은 항상 앞) |

## 5. 화면 구성

- **홈**: 자격증 이름 검색(초성 가능) + 목록
- **자격증 화면**: 초급 / 중급 / 고급 큰 박스 → 누르면 범위·문제 수·[시험 시작하기]. 그 아래 실전 문제풀이 박스. 시험 정보·출제 분석은 아래에 접혀 있습니다.
- **시험 화면**: 실제 CBT 시험과 같은 배열(위: 종목·문제 수, 가운데: 문제, 오른쪽: 답안 표기란, 아래: 이전·다음·안 푼 문제·채점).
  - `바로 답 확인하기` 를 켜 두면(기본) 보기를 고르는 즉시 정답이 나오고, 끄면 끝까지 푼 뒤 한꺼번에 채점합니다.
  - 키보드: `1`~`4` 답 선택, `Enter`/`→` 다음, `←` 이전
- **결과 화면**: 점수, 합격 판정, 과목별 정답률, **틀린 핵심 개념**(문제마다 한 줄), 약한 단원, 오답노트 저장
- **내 정보** (`/profile`, 상단 메뉴의 "로그인" / "내 정보")
  - 회원가입은 아이디·비밀번호·닉네임만 받습니다. 이메일을 받지 않아 **비밀번호 찾기는 없습니다.**
  - 칭호: 딴 자격증을 등록하면 등급별 배지(기능사 ★ · 산업기사 ★★ · 기사 ★★★ …)로 표시됩니다.
  - 점수 기록 / 내가 푼 문제 / 내가 틀린 문제 / 틀린 문제 핵심 개념 / 나만의 오답노트(문제마다 메모 가능, 인쇄 가능)
  - 로그아웃하면 그 기기에 남은 기록은 지워집니다 (여럿이 쓰는 사무실 PC 를 위해).

## 6. 배포 (GitHub → Cloudflare Workers)

코드를 GitHub 에 올리면 Cloudflare 가 자동으로 빌드·배포합니다.

### 6-1. 고친 내용을 올리기

```bash
git add -A
```

```bash
git commit -m "기출 추가"
```

```bash
git push
```

### 6-2. Cloudflare 설정 (한 번만)

Cloudflare 대시보드 → Workers & Pages → `test` → **Settings → Build** 에서:

| 항목 | 값 |
|---|---|
| Build command | 비워 둠 (설치 직후 `scripts/ci-build.mjs` 가 자동으로 빌드합니다) |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| **Settings → Domains & Routes** | `exampasso.com` 을 이 Worker 에 연결 (Custom domain) |

- 사이트 빌드는 `npm` 설치가 끝난 직후 `scripts/ci-build.mjs` 가 실행합니다 (`package.json` 의 `postinstall`). `npx wrangler deploy` 는 그 결과를 올리기만 합니다.
- 회원 정보는 Cloudflare 의 DB(D1, 이름 `qpass`)에 저장됩니다. **처음 배포할 때 Cloudflare 가 DB 를 자동으로 만들어 연결합니다.**
  - 만약 배포 로그에 D1 권한 오류(예: `Authentication error`, `d1` 관련 `10000`)가 나오면:
    Cloudflare 대시보드 → 오른쪽 위 프로필 → **API Tokens** → 이 프로젝트의 빌드 토큰(`test build token`) **Edit** →
    Permissions 에 **Account · D1 · Edit** 를 추가하고 저장한 뒤, 배포 화면에서 **Retry build** 를 누르세요.
  - DB 가 연결되지 않아도 사이트와 문제 풀이는 정상 동작하고, 로그인 화면에만 "준비 중"이라고 나옵니다.
- 검색엔진용 주소(canonical, hreflang, sitemap)는 `config/brand.ts` 의 도메인(`https://exampasso.com`)으로 만들어집니다.
  다른 주소로 시험 배포할 때만 Build variables 에 `NEXT_PUBLIC_SITE_URL` (끝에 `/` 없이)을 넣으세요. **실제 서비스에서는 넣지 않습니다.**
- 같은 곳(Build 의 Variables and secrets)에 넣는 값: 문의 이메일 `CONTACT_EMAIL`, 소유확인 `GOOGLE_SITE_VERIFICATION`·`BING_SITE_VERIFICATION`, 애드센스 `NEXT_PUBLIC_ADSENSE_ID`. (`.env.example` 참고)
  네이버 소유확인 값은 `lib/site.ts` 에 이미 들어 있습니다. 값을 넣거나 바꾼 뒤에는 **다시 배포**해야 반영됩니다.
- Worker 이름을 바꾸면 `wrangler.jsonc` 의 `"name"` 도 같은 이름으로 바꿔야 합니다.

### 6-3. 검색엔진에 등록하기

**구글 서치콘솔** (https://search.google.com/search-console)

1. **속성 추가 → URL 접두어** 에 사이트 주소 입력
2. 소유확인 방법 중 **HTML 태그** 선택 → `content="…"` 안의 값만 복사
3. Cloudflare Build variables 의 `GOOGLE_SITE_VERIFICATION` 에 붙여넣고 다시 배포 → 서치콘솔에서 **확인**
4. 왼쪽 메뉴 **Sitemaps** 에 `sitemap.xml` 입력 후 제출 (언어별 목록 `sitemaps/ko.xml`, `sitemaps/en.xml` 이 그 안에 들어 있습니다)

**네이버 서치어드바이저** (https://searchadvisor.naver.com)

1. **웹마스터 도구 → 사이트 등록** 에 사이트 주소 입력
2. **HTML 태그** 방식 선택 → `content="…"` 안의 값만 복사
3. Cloudflare Build variables 의 `NAVER_SITE_VERIFICATION` 에 붙여넣고 다시 배포 → **소유확인**
4. **요청 → 사이트맵 제출** 에 `https://exampasso.com/sitemaps/ko.xml` 입력 (네이버에는 한국어 쪽만 내면 됩니다)

### 6-4. 내 컴퓨터에서 배포 묶음을 확인하고 싶을 때

`npm run dev` 를 **끈 상태에서** 실행해야 합니다. (개발 서버가 같은 폴더를 쓰고 있으면 권한 오류가 납니다)

```bash
npx wrangler deploy --dry-run
```

## 7. 관리자 화면

- `/admin` — 회원 수, 오늘·이번 주 가입자, 회원 목록, 문제 오류 신고 목록. 비밀번호는 어디에도 표시하지 않습니다.
- 잠금은 Cloudflare Access(Zero Trust)로 합니다. 코드에는 관리자 비밀번호가 없고, 서버가 Access 토큰을 직접 검증하므로
  Access 를 거치지 않은 요청(workers.dev 주소 등)은 404 가 나옵니다.
- Cloudflare 대시보드의 Worker 변수에 `CF_ACCESS_TEAM_DOMAIN`, `CF_ACCESS_AUD` 두 값을 넣어야 열립니다. 없으면 아무도 들어올 수 없습니다.
  (자세한 규칙은 [docs/code-rules.md](docs/code-rules.md) 5-1)

## 8. 알아 둘 점

- 지금 들어 있는 문제·해설은 모두 AI 가 만든 예상문제입니다. 정답을 가린 별도 AI 가 다시 풀어 정답이 일치한 문제는 "검수 완료", 그 기록이 없는 문제는 "검수 전"으로 표시됩니다. 사람 전문가 검수는 거치지 않았습니다.
- "이 문제를 맞혔다면 합격 가능성은? N%" 는 단원 중요도와 출제 빈도로 계산한 추정치입니다.
- 광고는 `NEXT_PUBLIC_ADSENSE_ID` 를 넣기 전에는 나오지 않습니다. 자리는 홈 목록 하단과 결과 화면 하단 두 곳입니다 (`components/AdSlot.tsx`).
  `/ads.txt` 는 빌드할 때 그 값으로 자동으로 만들어집니다.
- 소개·문의·개인정보처리방침·이용약관·면책 고지는 `content/pages/ko.ts`, `en.ts` 에 있습니다 (`/ko/about`, `/ko/privacy` …).
  글을 고치면 `content/pages/index.ts` 의 시행일(`INFO_UPDATED`)도 함께 고칩니다.
- 비밀번호는 원문을 저장하지 않고 해시(PBKDF2-SHA256)만 저장합니다. 로그인 5회 연속 실패 시 5분간 잠깁니다.
