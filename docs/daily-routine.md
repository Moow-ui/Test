# 매일 자격증 추가 루틴 (애드센스 신청 전 4주)

매일 한국시간 새벽 3시에 클라우드에서 자동 실행된다. **한 번 실행 = 한국 자격증 1개 + 미국 자격증 1개 추가.**

| | |
|---|---|
| 기간 | 2026-10-02(1회차) ~ **2026-10-29(28회차, 종료일 = 애드센스 신청일)** |
| 목표 | 28회 동안 50개 이상 (최대 56개). 누적은 이 루틴으로 추가한 것만 0부터 센다 |
| 진행 기록 | [reports/routine-progress.md](../reports/routine-progress.md) |
| 자격증 추가 절차 | [add-cert.md](add-cert.md) A 의 1~9 |

이 문서는 루틴이 매번 읽고 그대로 따르는 지시문이다. 실행하는 쪽은 이전 실행을 기억하지 못하므로
상태는 전부 `reports/routine-progress.md` 와 git 에 남긴다.

## 0. 시작

1. 먼저 `CLAUDE.md`, `docs/add-cert.md`, `docs/data-rules.md`, 이 문서를 읽는다. 본보기는 `data/certs/KR/electrician-craftsman/`.
2. `main` 브랜치의 최신 상태에서 작업한다 (`git fetch origin && git checkout main && git pull`). `npm ci` 로 설치한다.
3. 오늘 날짜는 한국시간으로 구한다: `TZ=Asia/Seoul date +%Y-%m-%d` (요일: `TZ=Asia/Seoul date +%u`, 7 = 일요일).
4. `reports/routine-progress.md` 를 읽는다.
   - 표의 행 수 = 끝난 회차 수. **28행이 이미 있으면 아무것도 하지 않고 "루틴 종료(28회 완료)"라고만 보고하고 끝낸다.**
   - 오늘 날짜의 행이 이미 있으면 (같은 날 두 번 실행) 아무것도 하지 않고 끝낸다.
   - "재시도 대기", "건너뜀", "이어서 할 작업" 목록을 확인한다.
5. 이번 작업과 무관한 미커밋 파일이 있으면 건드리지 않는다 (`git add -A`, `git add .` 금지. 고친 파일만 골라 add).

## 1. 오늘의 자격증 고르기 (한국 1개, 미국 1개)

나라마다 아래 순서로 1개를 고른다.

1. "이어서 할 작업"에 그 나라 자격증이 있으면 그것 (`routine/wip-{slug}` 브랜치에서 이어 한다. 실패 횟수로 세지 않는다).
2. "재시도 대기"에 있으면 그것 (어제 1번 실패한 것. 오늘 또 실패하면 "건너뜀"으로 옮긴다).
3. 없으면 `data/cert-queue.json` 에서 그 나라의 맨 앞 항목. 단 "건너뜀"에 있는 것은 넘어간다.

## 2. 자격증 1개 추가 (한국 먼저, 그다음 미국)

**하나가 실패해도 다른 하나는 진행한다.** 각 자격증은 `docs/add-cert.md` A 의 1~9 를 그대로 따른다. 요점:

1. **공식 확인**: 시행기관의 공식 출제기준·공지를 웹에서 찾아 과목·문항 수·시간·선지 수·합격 기준을 확인하고 `sources` 에 적는다.
   공식 자료로 확인하지 못하면 지어내지 말고 실패로 처리한다.
2. `meta.json`, `chapters.json` 작성. 미국 자격증은 `/en` 에 나오므로 **전부 영어로** 쓰고, 시행기관의 상표 규정을 확인해 `trademarkNotice` 를 적는다.
3. **문제 작성**: 전부 직접 만든 예상문제. 기출 원문·복원 문제·시행기관이 공개한 문제은행 문장을 옮겨 적지 않는다.
   - 수량: 과목마다 실제 문항 수 이상(실전 1회분 이상) + 초급·중급·고급 각각 30문제 이상 풀 수 있게. 검증에서 탈락할 것을 감안해 10% 쯤 넉넉히 쓴다.
   - 초급 30 = `level: basic` 이면서 levelLock 이 아닌 문제 30개 이상. 고급 30 = intermediate + advanced 합계 30개 이상.
   - 해설 형식·수준은 `docs/data-rules.md` 7장.
4. **문제 검증 (필수, 작성과 분리)**: `docs/add-cert.md` A-5.
   - 작성한 문제에서 `answer`, `explanation`, `oneLineConcept`, `choicesByLevel` 을 뺀 파일을 만들고, **그 파일만 받은 별도 에이전트(하위 에이전트)** 가 전부 다시 푼다. 계산 문제는 풀이 과정을 적게 한다.
   - 하위 에이전트를 쓸 수 없으면 정답을 뺀 파일만 보고 답을 먼저 전부 적은 뒤에 정답과 비교한다.
   - 법규·기준·수치는 공식 자료로 최신 여부를 확인한다.
   - 불일치 → 고치고 다시 검증. 확신이 없으면 `data/review-queue/{slug}.json` 에 보관하고 게시하지 않는다.
   - 결과를 `reports/{YYYY-MM}/verify-{slug}.md` 에 적는다: 작성 N · 통과 N · 수정 후 통과 N · 탈락(보관) N.
5. 통과한 문제만 `npm run questions:add` 로 넣는다. **넣는 파일의 모든 문제에 `reviewedAt`(오늘 날짜, 한국시간 `YYYY-MM-DD`)을 적는다.**
   그러면 `reviewStatus: "verified"` 로 들어가 화면에 "AI 예상문제 · 검수 완료"로 표시된다 (4번 검증을 통과하지 않은 문제에는 적지 않는다).
6. **운영진 학습 팁 3개 작성**: `docs/add-cert.md` A-6. `meta.json` 의 `studyTips` 에 `studyOrder`(공부 순서), `hardChapters`(자주 틀리는 단원),
   `examDay`(시험 당일 팁)를 각 2~4문장으로 쓴다 (미국 자격증은 영어).
   - 방금 만든 `chapters.json`(과목·단원 이름, 문항 수, 출제 비중·중요도)과 `examInfo`(문항 수·시간·합격 기준·과락)에 근거해 쓴다.
   - 확인할 수 없는 합격률·통계는 쓰지 않는다. **이용자 후기를 지어내 넣지 않는다** (후기란은 비워 둔 채로 게시된다).
7. **검사 (전부 통과해야 게시)**

   ```bash
   npm run validate && npm run check:cert -- {slug} && npm test && npm run build && npm run check:meta
   ```

   - 문제 수가 모자라 `check:cert` 가 실패하면 문제를 더 써서 4번부터 다시 한다.
   - 자격증을 추가하면서 `app/`, `components/`, `lib/`, `scripts/` 는 고치지 않는다. 고쳐야만 통과한다면 실패로 처리하고 사유를 적는다.
8. **커밋 1개 + push**: 대기 목록에서 빼고, 그 자격증의 파일만 add 한다.

   ```bash
   git add data/certs/{country}/{slug} data/cert-queue.json reports/{YYYY-MM}/
   git add data/review-queue/{slug}.json   # 보관한 문제가 있을 때만
   git commit -m "cert: add {slug}"
   git push origin HEAD:main
   ```

   push 가 거절되면(다른 변경이 먼저 올라감) `git pull --rebase origin main` 뒤 다시 push 한다. 강제 push 는 하지 않는다.
9. **배포 확인**: push 후 몇 분 기다린 뒤 `https://exampasso.com/ko/cert/{slug}` (미국은 `/en/cert/{slug}`) 와
   `https://exampasso.com/data/{slug}/pool.json` 이 200 인지 본다. 10분이 지나도 안 열리면 진행 기록의 "회장 확인 필요"에 적는다.

### 실패했을 때

- 7번 검사 중 하나라도 실패했고 고칠 수 없으면 **그 자격증은 배포하지 않는다.**
  그 자격증의 변경만 되돌린다 (`git restore --staged --worktree data/cert-queue.json` 과 새로 만든 폴더 삭제. 원래 "준비 중"으로 있던 `meta.json` 은 원래대로 되돌린다).
- 처음 실패 → "재시도 대기"에 적는다. 재시도에서도 실패 → "건너뜀"에 사유와 함께 적는다. 누적 실패 수를 1 올린다 (자격증 1개당 건너뛸 때 1).
- **사용량 한도·시간 부족으로 중단될 것 같으면** 실패로 세지 않는다. 지금까지의 작업을 `routine/wip-{slug}` 브랜치에 커밋해 push 하고
  (`main` 에는 올리지 않는다), 진행 기록의 "이어서 할 작업"에 slug 와 어디까지 했는지 적어 `main` 에 올린다.

## 3. 진행 기록 (`reports/routine-progress.md`)

실행이 끝나면 (둘 다 실패했어도) 표에 한 줄을 덧붙인다.

```
| 회차 | 날짜 | 추가된 자격증 | 검증(작성/탈락) | 누적 한국 | 누적 미국 | 누적 합계 | 목표 50 대비 | 비고 |
| 1 | 2026-10-02 (금) | KR driver-license-written · US dmv-permit-california | 150/4 | 1 | 1 | 2 | 4% | |
```

- 누적은 이 루틴으로 추가해 배포한 자격증 수 (0부터). % = 합계 ÷ 50, 반올림.
- "검증(작성/탈락)" = 오늘 작성한 문제 수 / 검증에서 탈락해 보관한 문제 수 (두 자격증 합계).
- 실패·건너뜀은 비고에 적고, 아래 목록(재시도 대기 / 건너뜀 / 이어서 할 작업 / 누적 실패)을 고친다.
- **누적 실패가 6개를 넘으면** 파일 맨 위(제목 바로 아래)에 `> ⚠ 목표 50개 미달 위험` 을 적는다.
- **일요일 실행**에서는 파일 아래 "주간 요약"에 덧붙인다: 이번 주 추가 수, 검증 탈락률(탈락 ÷ 작성), 회장 확인 필요(3줄 이내).
- **28회차(2026-10-29)** 에서는 마지막 줄 아래에 "루틴 종료. 최종 누적 N개"를 적는다.

커밋: `git add reports/routine-progress.md && git commit -m "routine: day {회차}" && git push origin HEAD:main`

## 4. 마지막 보고

추가된 자격증, 실패·건너뜀, 누적 개수, 남은 회차를 짧게 적는다.
