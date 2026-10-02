# 데이터 규칙

스키마의 정의는 [lib/schemas.ts](../lib/schemas.ts), 폴더·파일 이름 규칙은 [lib/data/paths.ts](../lib/data/paths.ts) 에 있다.
이 문서와 코드가 다르면 코드가 맞다.

## 1. 폴더 구조

```
data/
  certs/{country}/{slug}/         country 는 KR 또는 US
    meta.json                     자격증 정보
    chapters.json                 과목·단원 (문제가 준비된 자격증만)
    questions/{chapterId}.json    단원별 문제
    questions/{chapterId}-2.json  한 파일이 300문항을 넘으면 -2, -3 … 으로 나눈다
    exams/{year}-{round}.json     실전 모의고사 구성 (문제 id 목록)
    assets/                       문제 그림 (회로도 등)
  cert-queue.json                 앞으로 추가할 자격증 대기 목록 (나라별 응시자 수 순. 시행기관·기출 공개 여부·이용 조건 메모)
  review-queue/{slug}.json        검증에서 확신이 없어 게시하지 않은 문제 (문제 전체 + reviewNote 사유. 새 문제는 id 없음, 게시했다가 중단한 문제는 id 포함)
  legacy-question-ids.json        새 id 규칙 이전에 만든 문제 id (고치지 않는다)
reports/{YYYY-MM}/                작업 리포트. 월별 폴더에 쌓는다
public/data/                      빌드 때 자동으로 만든다 (git 에 올리지 않는다)
```

- 자격증 폴더에는 위 다섯 이름(`meta.json`, `chapters.json`, `questions`, `exams`, `assets`)만 둘 수 있다.
- 폴더 이름 = `meta.json` 의 `id`, 나라 폴더 = `country`.
- **slug 는 나라가 달라도 겹치면 안 된다.** 한번 정하면 바꾸지 않는다 (URL·문제 id·배포 파일 주소에 쓰인다).
- 자격증 목록·검색 인덱스·sitemap 은 빌드할 때 이 폴더를 읽어 자동으로 만든다. 손으로 고치는 목록은 없다.

## 2. meta.json

| 필드 | 설명 |
|---|---|
| `id` | 영문 slug. 폴더 이름과 같다 |
| `country` | `KR` 은 `/ko`, `US` 는 `/en` 에만 나온다 |
| `name`, `officialName`, `spacedName`, `shortNames[]` | 이름과 검색어 변형 |
| `relatedCertIds[]` | 관련 자격증 slug (같은 나라, 실제로 있는 것만) |
| `grade` | 등급 (기능사·산업기사·기사·1급·2급 등). 등급이 없는 자격증은 적지 않는다 |
| `field` | 분야 (건설·전기·IT·사무·조리·운전·의료 등). 홈의 분야 필터가 이 값으로 묶으므로 이미 쓰는 이름에 맞춘다 |
| `certType` | 자격 종류. `CERT_TYPES` 중 하나: `national-technical`(국가기술자격) · `national-professional`(국가전문자격) · `accredited-private`(국가공인 민간자격) · `private`(민간자격) · `license`(면허) · `state-license` · `federal-certification` · `professional-certification` · `other`(검정·시험) |
| `issuer` | 시행기관 `{ name, url }`. 어느 기관이든 같은 모양. 기관이 여러 곳이면(주별 면허 등) `url` 은 비운다 |
| `trademarkNotice` | (선택) 시행기관의 상표 사용 규정에 따른 상표 고지 문장. 자격증 페이지 아래에 그대로 나온다 |
| `order` | 목록 순서 (작을수록 앞). 문제가 준비된 자격증은 이 값과 상관없이 항상 앞에 온다 |
| `updatedAt` | 내용 최종 수정일 `YYYY-MM-DD` (sitemap) |
| `examInfo` | `totalQuestions`, `timeLimitMinutes`, `format`, `choiceCount`(선지 수, 기본 4), `passCriteria { averageScore, subjectMinScore(과락 없으면 null), description }` |
| `content` | `eligibility`, `intro`, `trendSummary`, `studyTip`, `faqs[3~5]` |
| `studyTips` | 운영진 학습 팁 3개 `{ studyOrder(공부 순서), hardChapters(자주 틀리는 단원), examDay(시험 당일 팁) }`. 각 2~4문장. 문제가 있는 자격증에는 필수 |
| `sources[]` | 정보의 출처 `{ title, url? }` (공식 출제기준 등) |

- "준비 중" 자격증은 `id`~`order` 까지만 있으면 된다.
- `chapters.json` 이 있으면 `examInfo` 와 `updatedAt` 이 반드시 있어야 한다.
- 자격증마다 다른 점(선지 수, 합격 기준, 과락 등)은 전부 여기 값으로 처리한다. 코드에서 slug 로 분기하지 않는다.

## 3. chapters.json

```json
{ "subjects": [ { "id": "...", "name": "...", "questionCount": 20, "chapters": [ ... ] } ] }
```

- **Subject**: `id`, `name`, `questionCount`(실제 시험의 과목 문항 수), `chapters[]`
  - 과목 `questionCount` 의 합 = `examInfo.totalQuestions`
- **Chapter**: `id`, `name`, `importance`(1~5), `examWeight`(과목 내 %, 합계 100), `summary`, `keyPoints[]`
  - 단원 id 는 자격증 안에서 유일해야 한다. `past`, `quiz`, `cbt`, `notes`, `opengraph-image` 는 쓸 수 없다 (URL 충돌).
  - 단원 id 도 한번 정하면 바꾸지 않는다 (URL 과 문제 파일 이름에 쓰인다).

## 4. 문제 (questions/{chapterId}.json)

파일은 문제의 배열이다. 한 파일에는 한 단원의 문제만 넣는다.

| 필드 | 설명 |
|---|---|
| `id` | 아래 "문제 id 규칙" |
| `certId`, `subjectId`, `chapterId` | 자격증 slug, 과목 id, 단원 id |
| `source` | 항상 `"predicted"` |
| `level` | `basic` / `intermediate` / `advanced` |
| `stem` | 문제 |
| `choices[]` | 선지. 개수는 `examInfo.choiceCount` 와 같아야 하고 서로 달라야 한다 |
| `answer` | 정답 번호 (1부터, 선지 수 이하) |
| `choicesByLevel` | 난이도별로 남길 선지 번호 `{ basic: [정답, 오답], intermediate: [3개] }`. 아래 "난이도별 선지 수" |
| `levelLock` | (선택, 기본 false) true 면 선지를 줄일 수 없는 문제. 초급·중급에 나오지 않는다 |
| `oneLineConcept` | 핵심 개념 한 줄 (40자 내외, 최대 70자) |
| `explanation` | 해설 (마크다운) |
| `frequency` | 출제 빈도 1~5 |
| `reviewStatus` | `"verified"` = 작성과 분리된 AI 검증([add-cert.md](add-cert.md) A-5: 정답을 가린 별도 AI가 다시 풀어 정답 일치 확인)을 통과한 문제. 화면에 "검수 완료". `"unverified"` = 그 검증 기록이 없는 문제. 화면에 "검수 전". 사람 전문가 검수를 뜻하지 않는다 |
| `reviewedAt` | 검증을 통과한 날짜 `YYYY-MM-DD`. `verified` 문제에는 필수, `unverified` 문제에는 적지 않는다. 문제를 고치면 다시 검증하고 날짜를 새로 적는다 |
| `tags[]` | 태그 |
| `image` | (선택) `assets/` 안의 그림 파일 이름 |
| `version` | (선택, 기본 1) 문제를 고칠 때마다 1씩 올린다 |
| `retired` | (선택, 기본 false) 삭제 대신 true |

### 난이도별 선지 수

| 풀이 | 보여 주는 선지 수 |
|---|---|
| 초급 | 2개 |
| 중급 | 3개 |
| 고급 | 4개 |
| 실전 문제풀이 (단원 풀기·오답노트·틀린 문제 다시 풀기 포함) | 시험의 실제 선지 수 (`examInfo.choiceCount`) |

- 문제에는 언제나 실제 시험과 같은 수의 선지를 적는다. 초급·중급에서는 그 가운데 일부만 보여 준다.
- **무엇을 남길지는 데이터에 미리 적는다 (`choicesByLevel`).** 화면에서 아무 오답이나 무작위로 빼지 않는다.
  - 남기는 것은 **정답 + 가장 그럴듯한 오답**(헷갈리기 쉬운 것). 번호는 원래 선지 번호, 작은 것부터.
  - 초급의 선지는 중급의 선지 안에 들어 있어야 한다. 선지를 모두 보여 주는 난이도는 적지 않는다
    (4지선다면 `basic`, `intermediate` 만. 5지선다면 `advanced` 4개도 적는다).
  - 예: 정답이 3번이고 1번이 가장 헷갈리는 오답, 그다음이 2번이면 `{ "basic": [1, 3], "intermediate": [1, 2, 3] }`
- **선지를 줄이면 뜻이 깨지는 문제는 `levelLock: true`** (이때 `choicesByLevel` 은 적지 않는다).
  - "옳지 않은 것은?", "해당하지 않는 것은?", "모두 고르시오", "옳은 것은 몇 개인가?", "①과 ②", "ㄱ, ㄴ" 처럼 다른 선지를 가리키는 선지
  - 초급·중급에는 나오지 않는다 (고급·실전 문제풀이·단원 풀기에는 선지를 모두 보여 주며 나온다). 난이도(`level`)가 basic 인 잠금 문제는 실전 문제풀이 와 단원 풀기에만 나온다.
- 답은 언제나 **원래 선지 번호**로 저장한다 (오답노트·풀이 기록이 원래 번호를 가리킨다). 화면의 ①②③ 은 보이는 순서일 뿐이다.
- `npm run questions:add` 는 두 값을 비워 두면 자동으로 채운다 (규칙: `lib/choice-reduce.ts`). 자동 판단은 어림이므로,
  CSV 의 `distractorOrder`(오답을 그럴듯한 순서로, 예: `2|4|1`)와 `levelLock` 열로 직접 정하는 편이 좋다.
- 이미 있는 문제에 한꺼번에 채울 때: `npm run choices:convert` (값이 없는 문제만 채운다. `--picks` 로 사람이 정한 값을 넣는다).

### 문제 id 규칙 (영구)

```
{slug}-{chapterId}-{4자리 번호}      예: electrician-craftsman-dc-circuit-0007
```

- **한번 정한 id 는 절대 바꾸거나 다시 쓰지 않는다.** 회원의 오답노트·풀이 기록이 id 를 가리킨다.
- 번호는 그 단원에서 쓴 가장 큰 번호 + 1. 출제 중단한 문제의 번호도 다시 쓰지 않는다. (`npm run questions:add` 가 자동으로 붙인다)
- **문제를 고치면** id 는 그대로 두고 `version` 만 올린다.
- **문제를 없애려면** 지우지 말고 `retired: true` 로 표시한다. 새로 출제되지 않지만 오답노트·기록에서는 계속 보인다.
- 문제를 다른 단원으로 옮겨도 id 는 그대로 둔다 (id 의 단원 부분은 "만들 때의 단원"이다). 파일만 새 단원 파일로 옮긴다.
- 2026-10 이전에 만든 497문제는 `electrician-craftsman-p001` 형식이다. 이 id 도 영구 id 이므로 바꾸지 않는다.
  `data/legacy-question-ids.json` 에 적힌 id 만 예전 형식을 허용한다. 이 파일에 새 id 를 추가하지 않는다.

## 5. exams/{year}-{round}.json

```json
{ "title": "2027년 1회 실전 모의고사", "questionIds": ["...", "..."] }
```

미리 구성해 둔 모의고사다. 문제 id 는 그 자격증에 실제로 있어야 한다.
(지금의 실전 문제풀이은 문제를 무작위로 뽑는다. 이 파일을 쓰는 화면은 아직 없다)

실전 문제풀이 는 **실제 시험과 같은 문항 수**로만 낸다. 그래서 과목마다 문제가 `questionCount` 개 이상 있어야 하고,
모자라면 화면에 "문제 준비 중"으로 나온다 (`npm run validate` 의 현황에 자격증별로 표시된다).

## 6. 검사 (`npm run validate`)

한 명령으로 전체 데이터를 검사한다. `npm run build` 앞에서 자동으로 실행되고, 실패하면 빌드·배포가 중단된다.

- 스키마·필수 필드, 폴더·파일 이름
- 문제 id 형식, id 중복 (자격증 사이 포함)
- 정답 번호 범위, 선지 수(`choiceCount`), 선지 중복
- 난이도별 선지(`choicesByLevel`): 개수(초급 2·중급 3·고급 4), 정답 포함, 번호 범위, `levelLock` 과 함께 쓰지 않았는지
- 과목·단원 참조, 파일의 단원과 문제의 단원 일치, 파일당 300문항
- 과목 문항 수 합계, 단원 출제 비중 합계 100
- 관련 자격증 참조, 모의고사의 문제 id, 그림 파일 존재
- 문제가 있는 자격증에 운영진 학습 팁(`studyTips`)이 있는지
- 검수 표시: `reviewStatus: "verified"` 와 `reviewedAt` 이 짝이 맞는지

## 7. 콘텐츠 정책

- **모든 문제는 AI 예상문제다. 기출 원문을 싣지 않는다 (사용자 결정, 2026-10-01).** 사서 넣는 것도 저작권 문제가 있다고 본다.
  - 기억에 의존해 "○○년 ○회 기출"이라고 지어내지 않는다 (가짜 기출이 된다).
  - 다른 사이트의 기출·복원 문제를 긁어 오지 않는다.
  - 대신 실제 시험의 출제 유형·난도와 비슷하게 만든다 (공식 출제기준의 과목·항목, 자주 나오는 개념과 숫자 기준 위주).
- 문제는 반드시 `source: "predicted"`. 검증을 통과한 문제는 `reviewStatus: "verified"` + `reviewedAt`, 검증 기록이 없으면 `"unverified"`.
- 검증에서 탈락한 기존 문제는 지우지 않고 `retired: true` 로 게시를 중단하고, 사본을 `data/review-queue/{slug}.json` 에 사유(`reviewNote`)와 함께 둔다.
- **해설 형식**: "핵심 설명(계산은 번호 목록) + **틀린 선지** 목록". 해설 본문에서는 선지를 번호(①~④)로 가리키지 않는다.
- **해설 수준**: "현장 경험은 있지만 이론 공부는 오랜만인 50대가 이해할 수 있는 수준".
  쉬운 말, 전문용어는 괄호로 풀이, 계산은 한 단계씩 + 검산, 오답 선지가 왜 틀렸는지 포함.
- 시험 과목·문항 수는 개편으로 자주 바뀐다 (예: 건설안전기사 2026년부터 6과목 → 5과목). 새 자격증은 공식 출제기준으로 확인하고 `sources` 에 적는다.
- 전기설비 과목은 최신 KEC(한국전기설비규정) 기준.
- 시행기관은 자격증마다 `issuer` 에 적는다 (코드·화면 문구에는 기관 이름을 적지 않는다).
- 지게차운전기능사는 공식 과목이 하나라서, 4개 영역과 영역별 문항 수는 학습용 구분(어림값)이다.
- 미국 자격증은 지금 목록만 있고 전부 "준비 중"이다 (영어 문제는 아직 없음).
- 사이트 하단 고지: "실제 기출문제가 아니라 직접 만든 AI 예상문제이며 오류가 있을 수 있음"
- **가짜 후기·지어낸 수치 금지. AI·운영진이 쓴 글은 표시한다.**
  - 운영진 학습 팁(`studyTips`)은 그 자격증의 과목·단원·시험 구성 데이터에 근거해 쓰고 화면에 "운영진 작성"으로 표시한다. 확인할 수 없는 합격률·통계는 쓰지 않는다.
  - 이용자 후기는 DB(D1)에만 있고 데이터 폴더에는 없다. 후기를 만들어 넣지 않는다.
  - "이번 주 풀이 N회"와 평균 별점은 실제 집계값이다. 초깃값을 넣지 않고, 기준(풀이 20회, 후기 5개)에 못 미치면 화면에 보이지 않는다.
