# 문제 검증: dmv-permit-georgia (Georgia DMV Permit Test)

- 날짜: 2026-10-20 (매일 루틴, 새벽)
- 방법: 정답·해설·핵심 개념·choicesByLevel 을 뺀 파일만 받은 별도 에이전트가 137문항을 모두 다시 풀었다. 그림 문제는 `npm run images:render -- dmv-permit-georgia` 로 만든 PNG 를 보고 풀었다.
  주 법규 수치는 dds.georgia.gov 가 링크한 Georgia Drivers' Manual(2023-2024판, 현행)·DDS 안내 페이지와 대조했다 (law.justia.com 의 O.C.G.A. 미러는 실행 환경에서 403).
- 시험 구성: DDS 안내(https://dds.georgia.gov/testing-and-training/test-and-exams-information) — Road Signs 20문항 + Road Rules 20문항, 각 20문항 중 15문항 이상 정답. 시간 제한 공지 없음 → 연습 모의고사는 30분.

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 137 | 137 | 0 | 0 |

- 다시 풀기 137/137 일치. 계산 문제 2개(자전거 추월 감속, 과속 벌점) 재계산 일치.
- 작성 때 뺀 것(공식 자료로 확인 못 함·자료끼리 다름): 임시면허 유효기간(매뉴얼 안에서 2년/1년 표기가 다름), 스쿨존 제한속도 수치, 따라갈 때 전조등 하향 거리.

## 그림 (visualNeed high, 3단원)

- 문제 그림 9 + 개념 그림 3. 표지판은 MUTCD(미국 연방정부 저작물, 퍼블릭 도메인), 노면 표시는 직접 그림.

| 그림 | 체크리스트 |
|---|---|
| do-not-enter · no-u-turn · one-way (regulatory-signs) | ① PASS ② PASS ③ PASS ④ PASS |
| t-intersection · merge · curve-right (warning-signs) | ① PASS ② PASS ③ PASS ④ PASS |
| no-passing-markings · center-turn-lane · lane-control-x (signals-markings) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-shapes · railroad-crossing-signs · center-line-types (개념) | ① PASS ② PASS ③ PASS ⑤ PASS |

## 기출

- 기출 0 / AI 137.
- 기출 미수록 사유: DDS 는 운전자 매뉴얼만 공개하고 실제 문제은행은 비공개.

## 개념 정리

- 8단원 모두 1차 검증 PASS (검증 기록 `reports/2026-10/concepts-verify/verify-dmv-permit-georgia.json`). 검증 의견에 따라 "crossbuck 아래 판이 선로 수를 보여 준다" → "보여 줄 수 있다"로 표현만 다듬음.
