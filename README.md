# 큐패스 — 국가기술자격 기출·예상문제 풀이 사이트

> 합격에 필요한 것만, 중요한 순서대로

자격증 선택 → 출제 분석 확인 → 난이도·문항 수 선택 → 한 문제씩 풀고 즉시 채점·해설.
로그인 없이 동작하며, 풀이 기록은 사용자의 브라우저(localStorage)에만 저장됩니다.

- 기술: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · zod · vitest
- 현재 풀 수 있는 자격증: **전기기능사 필기** (AI 예상문제 60개). 나머지 29종은 "준비 중"
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
| `npm run build` | 배포용으로 빌드 (에러가 없어야 배포 가능) |
| `npm run start` | 빌드한 결과를 실행 |
| `npm test` | 단위 테스트 (출제 배분, 채점, 합격 판정, 초성 검색, 데이터 검증) |
| `npm run validate` | `/data` 폴더 데이터 검증 + 과목·단원별 문제 수 출력 |
| `npm run import -- <파일> --cert <id>` | 문제 가져오기 (CSV/JSON) |
| `npm run check:meta` | 빌드 결과의 title·description 중복, noindex, sitemap 검사 |

## 3. 문제 넣기 (import)

**기출문제의 저작권은 한국산업인력공단에 있습니다. 사용 권리가 확인된 데이터만 넣으세요.**

1. `scripts/templates/questions-template.csv` 를 엑셀로 열어 같은 형식으로 문제를 적습니다.
   - 과목·단원은 id(`dc-circuit`) 대신 이름(`직류회로`)으로 적어도 됩니다.
   - `source`: `기출` 또는 `예상` / `level`: `초급`·`중급`·`고급` / `reviewStatus`: `검수완료`·`검수전`
   - 기출이면 `year`(연도), `round`(회차), `number`(문항 번호)를 적습니다.
   - 해설 줄바꿈은 셀 안에서 `Alt + Enter` 를 누르거나 `\n` 이라고 적습니다.
2. 먼저 검사만 해 봅니다. (파일은 바뀌지 않습니다)

```bash
npm run import -- 내문제.csv --cert electrician-craftsman --dry-run
```

3. 오류가 없으면 실제로 넣습니다.

```bash
npm run import -- 내문제.csv --cert electrician-craftsman --out past-2023-1.json
```

4. 확인합니다.

```bash
npm run validate
```

- 오류가 있는 줄은 화면과 `import-report.json` 에 줄 번호와 이유가 나오고, 통과한 줄만 들어갑니다.
- 같은 파일을 다시 넣어 내용을 바꾸려면 끝에 `--update` 를 붙입니다.
- 기출문제가 들어가면 초급·중급은 기출 위주로, 고급은 기출과 예상문제가 50:50 으로 출제되고,
  기출 페이지 제목도 "기출 유형 문제"에서 "기출문제"로 자동으로 바뀝니다.

### 새 자격증 추가하기

1. `data/certs/<자격증 id>.json` 을 만듭니다. (`data/certs/electrician-craftsman.json` 을 복사해서 고치면 됩니다)
   시험 정보, 과목, 단원(중요도·출제 비중·요약), 자격증 소개·FAQ 가 들어갑니다.
2. 문제를 import 합니다.
3. `npm run validate` → `npm test` → `npm run build` → `npm run check:meta`

자격증 id 는 `data/certifications.json` 에 있는 값이어야 합니다. 과목·단원과 문제가 모두 들어가면
"준비 중" 표시가 사라지고 검색엔진 색인 대상(sitemap)에 자동으로 포함됩니다.

## 4. 조정할 수 있는 값

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 중요도 ★·합격 기여도 % 공식의 계수 | `lib/scoring.ts` 의 `SCORING` |
| 난이도 카드 구성, 기출:예상 비율, 문항 수 버튼, "최근 7일" | `lib/quiz-engine.ts` 의 `LEVEL_RULES`, `QUIZ_COUNTS`, `RECENT_DAYS` |
| 페이지 제목·설명 문구 규칙 | `lib/seo.ts` |
| 사이트 이름·하단 고지 문구 | `lib/site.ts` |
| 색상·글씨 크기 3단계 | `app/globals.css` |
| 자격증 목록·노출 순서 | `data/certifications.json` (위에 있을수록 먼저 노출) |

## 5. Vercel 배포 가이드

### 5-1. GitHub 에 올리기 (처음 한 번)

1. https://github.com 에 로그인 → 오른쪽 위 `+` → **New repository** → 이름(예: `qpass`) 입력 → **Create repository**
2. 이 폴더의 터미널에서 아래를 실행합니다. (`내아이디` 는 본인 GitHub 아이디로 바꾸세요)

```bash
git remote add origin https://github.com/내아이디/qpass.git
```

```bash
git push -u origin master
```

### 5-2. Vercel 에 연결하기

1. https://vercel.com 에 GitHub 계정으로 로그인
2. **Add New… → Project** → 방금 만든 저장소 옆의 **Import**
3. 설정은 그대로 두고(Framework: Next.js 가 자동 선택됨) **Deploy**
4. 1~2분 뒤 `https://프로젝트이름.vercel.app` 주소가 생깁니다.

### 5-3. 환경변수 넣기 (중요)

Vercel 프로젝트 → **Settings → Environment Variables** 에서 아래를 추가하고 **Redeploy** 합니다.

| 이름 | 값 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://내도메인` | 실제 사이트 주소 (끝에 `/` 없이). canonical·sitemap·OG 이미지 주소에 쓰입니다. **꼭 넣으세요** |
| `GOOGLE_SITE_VERIFICATION` | 구글이 준 값 | 구글 서치콘솔 소유확인 |
| `NAVER_SITE_VERIFICATION` | 네이버가 준 값 | 네이버 서치어드바이저 소유확인 |

값의 예시는 `.env.example` 에 있습니다.

### 5-4. 검색엔진에 등록하기

**구글 서치콘솔** (https://search.google.com/search-console)

1. **속성 추가 → URL 접두어** 에 사이트 주소 입력
2. 소유확인 방법 중 **HTML 태그** 선택 → `content="…"` 안의 값만 복사
3. Vercel 환경변수 `GOOGLE_SITE_VERIFICATION` 에 붙여넣고 Redeploy → 서치콘솔에서 **확인**
4. 왼쪽 메뉴 **Sitemaps** 에 `sitemap.xml` 입력 후 제출

**네이버 서치어드바이저** (https://searchadvisor.naver.com)

1. **웹마스터 도구 → 사이트 등록** 에 사이트 주소 입력
2. **HTML 태그** 방식 선택 → `content="…"` 안의 값만 복사
3. Vercel 환경변수 `NAVER_SITE_VERIFICATION` 에 붙여넣고 Redeploy → **소유확인**
4. **요청 → 사이트맵 제출** 에 `https://내도메인/sitemap.xml` 입력
5. **요청 → 웹 페이지 수집** 에 자격증 페이지 주소를 넣으면 더 빨리 수집됩니다.

### 5-5. 내용을 고친 뒤 다시 배포하기

```bash
git add -A
```

```bash
git commit -m "문제 추가"
```

```bash
git push
```

push 하면 Vercel 이 자동으로 다시 빌드·배포합니다.

## 6. 숨김 경로

- `/admin/reports` — 문제 오류 신고 목록. 비밀번호 없이 주소를 아는 사람만 들어가는 방식이며 검색엔진에는 색인되지 않습니다.
  지금은 **신고한 사람의 브라우저에만** 저장되므로, 여러 사용자의 신고를 모으려면 나중에 Supabase 같은 서버 저장소로 옮겨야 합니다.

## 7. 알아 둘 점

- 문제·해설은 모두 AI 가 만든 예상문제이며 "검수 전"으로 표시됩니다. 공개 전에 전문가 검수를 권합니다.
- 합격 기여도(%)는 공식으로 계산한 **추정치**입니다. 실사용자 데이터가 쌓이면 `lib/scoring.ts` 의
  `PassContributionProvider` 를 구현해 실측값으로 바꿀 수 있습니다.
- 광고는 아직 없습니다. 자리는 `components/AdSlot.tsx` 로 잡아 두었고, `.env.local` 에
  `NEXT_PUBLIC_SHOW_AD_SLOTS=1` 을 넣으면 위치를 점선 상자로 미리 볼 수 있습니다.
