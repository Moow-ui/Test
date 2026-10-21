# 문제 검증: dmv-permit-michigan (Michigan DMV Permit Test)

- 날짜: 2026-10-22 (매일 루틴, 새벽)
- 방법: 정답·해설·핵심 개념·오답 순서를 뺀 파일만 받은 별도 에이전트가 150문항을 모두 다시 풀었다. 그림 문제는 `npm run images:render -- dmv-permit-michigan` 로 만든 PNG 를 보고 풀었다.
  사실 확인 기준은 Michigan Department of State 공식 핸드북 *What Every Driver Must Know* (SOS-133, Rev. 10/2025, michigan.gov 에서 PDF 직접 내려받음). 혈중알코올 수치(0.08 OWI, 0.17 high BAC, 21세 미만 any bodily alcohol content)는 핸드북 본문에 없어 Michigan State Police OHSP 음주운전 법 안내(검색 결과로 확인, michigan.gov 페이지는 실행 환경에서 403)와 Michigan Vehicle Code 257.625 기준.
- 시험 구성: 핸드북에 "written knowledge and road sign tests", 10대는 Segment 1 state exam 70% 이상. 실제 문항 수·시간은 핸드북에 없어 연습 모의고사는 표지 20 + 법규 30 = 50문항·30분, 80% 목표로 표기 (meta.json `examInfo.format`).

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 150 | 149 | 0 | 1 |

- 다시 풀기 150/150 일치 (149 높은 확신, 1 중간).
- 탈락 1: 21세 미만 음주 허용치 문항 — MCL 257.625 의 "any bodily alcohol content" 정의가 0.02~0.08 또는 (종교 의식 외) 체내 알코올 존재 두 갈래라서 "0.02 미만"과 "전혀 안 됨"이 다툼 여지 → `data/review-queue/dmv-permit-michigan.json` 보관.
- 검증 의견(정답 유지): Michigan Left 문항의 정답 선지가 교차로 뒤 좌회전 과정을 짧게 줄여 씀 — 유일한 정답이라 그대로 둠. BAC 0.08·0.17 문항은 핸드북이 아니라 주법 근거 — 해설에 근거를 적음.

## 그림 (visualNeed high)

- 문제 그림 9장(10문항) 게시, 개념 그림 3장. 출처: MUTCD 표지(미국 연방정부 저작물, 퍼블릭 도메인)를 옮겨 그림, 차선·Michigan Left 그림은 직접 그림(self).

| 그림 | 체크리스트 |
|---|---|
| do-not-enter (R5-1) | ① PASS ② PASS ③ PASS ④ PASS |
| no-u-turn (R3-4) | ① PASS ② PASS ③ PASS ④ PASS |
| no-right-turn (R3-1) | ① PASS ② PASS ③ PASS ④ PASS |
| railroad-advance-warning (W10-1, 2문항) | ① PASS ② PASS ③ PASS ④ PASS |
| school-sign (S1-1) | ① PASS ② PASS ③ PASS ④ PASS |
| no-passing-pennant (W14-3) | ① PASS ② PASS ③ PASS ④ PASS |
| flashing-yellow-arrow | ① PASS ② PASS ③ PASS ④ PASS |
| center-left-turn-lane | ① PASS ② PASS ③ PASS ④ PASS |
| michigan-left | ① PASS ② PASS ③ PASS ④ PASS |
| sign-shapes (개념) | ① PASS ② PASS ③ PASS ⑤ (개념 검증에서 확인) |
| warning-sign-colors (개념) | 1차 ② FAIL(철도 예고 표지에 R 두 글자 없음) → R 추가 후 개념 검증에서 체크리스트 전체 다시 확인 |
| lane-lines (개념) | ① PASS ② PASS ③ PASS ⑤ (개념 검증에서 확인) |

## 기출

- 기출 0 / AI 149.
- 기출 미수록 사유: Michigan Department of State 는 실제 시험 문제은행을 공개하지 않는다. 핸드북의 Safe Driving Knowledge Test(샘플 문항)는 michigan.gov 이용 정책이 복제·2차적 저작물 작성을 사전 서면 허락 없이 금지해 이용 조건 불가.
