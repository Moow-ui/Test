# 자격증 추가하기 / 문제 넣기

**자격증 추가 = 데이터 폴더 하나 추가.** 코드는 고치지 않는다.
필드의 뜻은 [data-rules.md](data-rules.md) 참고. 이미 있는 `data/certs/KR/electrician-craftsman/` 을 본보기로 삼는다.

## A. 새 자격증 추가

1. **폴더 만들기**: `data/certs/{country}/{slug}/`
   - slug 는 영문 소문자·숫자·하이픈. 나라가 달라도 겹치면 안 되고, 한번 정하면 바꾸지 않는다.
   - "준비 중"으로 이미 있는 자격증이면 그 폴더에 파일을 채우면 된다.
2. **`meta.json`**: 이름, 등급, 분야, `examInfo`(문항 수·시간·선지 수·합격 기준), `content`(시행기관·소개·FAQ 3~5개), `sources`(공식 출제기준), `updatedAt`.
   - 과목·문항 수·합격 기준은 반드시 공식 출제기준으로 확인한다.
3. **`chapters.json`**: 과목과 단원.
   - 과목 `questionCount` 의 합 = `examInfo.totalQuestions`
   - 과목 안의 단원 `examWeight` 합 = 100
4. **문제**: `questions/{chapterId}.json`
   - 직접 쓰거나, CSV/JSON 으로 만들어 아래 B 의 명령으로 넣는다 (id 가 자동으로 붙는다).
   - 모든 단원에 문제가 1개 이상, 과목마다 초급·중급·고급이 모두 있어야 한다.
   - 전체 범위에서 초급 10문제, 중급·고급 20문제 이상 풀 수 있어야 한다 ("옳지 않은 것은?" 같은 levelLock 문제는 초급·중급에서 빠진다).
   - 실전 CBT 는 과목마다 문제가 실제 문항 수(`questionCount`) 이상 있어야 열린다. 모자라면 "문제 준비 중"으로 나온다.
   - 문제마다 `choicesByLevel`(초급·중급에 남길 선지) 또는 `levelLock` 이 있어야 한다 ([data-rules.md](data-rules.md) 의 "난이도별 선지 수").
5. **검사**

```bash
npm run validate
```

```bash
npm test
```

6. **빌드해서 화면 확인** (목록·검색·sitemap·자격증 화면이 자동으로 생긴다)

```bash
npm run build
```

7. **커밋 1개로 올린다.** 메시지는 `cert: add {slug}`. 문제가 생기면 이 커밋만 되돌리면 된다.

```bash
git add data/certs && git commit -m "cert: add {slug}"
```

`data/cert-queue.json` 에 있던 자격증이면 같은 커밋에서 대기 목록에서 뺀다.

## B. 문제 넣기·고치기

```bash
npm run questions:add -- 문제.csv --cert electrician-craftsman --dry-run
```

`--dry-run` 은 검증만 한다. 오류가 없으면 `--dry-run` 을 빼고 다시 실행한다.

- CSV 양식: `scripts/templates/questions-template.csv` (엑셀로 열어 작성. 과목·단원은 id 대신 이름으로 적어도 된다)
- **새 문제는 `id` 를 비워 둔다.** `{slug}-{단원 id}-{4자리 번호}` 로 그 단원의 다음 번호가 붙는다.
- **있는 문제를 고칠 때**는 `id` 를 적고 `--update` 를 붙인다. `version` 이 자동으로 1 올라간다.
- **문제를 없앨 때**는 지우지 말고 `retired` 열에 `true` 를 적어 `--update` 한다.
- **초급·중급에 남길 선지**: `distractorOrder` 열에 오답 번호를 그럴듯한 순서로 적는다 (예: `2|4|1`).
  선지를 줄일 수 없는 문제는 `levelLock` 열에 `true`. 둘 다 비워 두면 자동으로 채운다 (어림이므로 넣은 뒤 확인).
- 단원 파일이 300문항을 넘으면 `-2`, `-3` 파일로 자동으로 나뉜다.
- 결과 리포트는 `reports/{YYYY-MM}/` 에 쌓인다.

## C. 하지 말 것

- 문제 id 를 바꾸거나, 지운 문제의 번호를 다시 쓰지 않는다.
- 자격증을 추가하면서 `app/`, `components/`, `lib/` 를 고치지 않는다. 고쳐야 한다면 그 자격증만의 차이를 `meta.json` 값으로 표현할 방법을 먼저 찾는다.
- `public/data/` 를 직접 고치지 않는다 (빌드 때마다 새로 만든다).
- 기출 원문을 넣지 않는다.
