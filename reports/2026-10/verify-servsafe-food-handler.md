# 문제 검증: servsafe-food-handler (ServSafe Food Handler)

- 날짜: 2026-10-10 (매일 자격증 추가 루틴, 새벽)
- 방법: answer·explanation·oneLineConcept·choicesByLevel 을 뺀 파일(문제·선지만)을 별도 에이전트가 처음부터 다시 풀고, 정답이 둘이거나 없는 문제·FDA Food Code 2022 와 다른 문제·주/지역 규정에 따라 답이 달라지는 문제를 함께 찾음
- 기준: U.S. FDA Food Code 2022, ServSafe Food Handler 공개 과정 개요(5개 섹션, 40문항·시간 제한 없음·75% 합격)

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 108 | 107 | 0 | 1 |

## 결과

- 다시 풀기 108/108 일치. 확신도 high 107, medium 1.
- 보관 1: 맨손 접촉 금지 문제("NOT an acceptable way to handle ready-to-eat food") — 정답은 일치했으나 일부 주·지역은 승인된 대체 절차로 제한적 맨손 접촉을 허용(Food Code 3-301.11(D))해 지역 규정에 따라 답이 달라질 수 있음 → `data/review-queue/servsafe-food-handler.json`.
- 계산 문제(냉각 2단계, 4시간 시간 관리, 7일 날짜 표시) 재계산 일치.

## 기출

- 기출 0 / AI 107.
- 기출 미수록 사유: 비공개 — ServSafe 는 평가 문항을 공개하지 않음.

## 개념 정리

- 5단원. 1차 검증 time-temperature FAIL(재가열 행을 가금류 '1초 미만'과 한 줄로 묶음) → 수정 후 별도 에이전트 재검증 PASS. 나머지 4단원 PASS.
