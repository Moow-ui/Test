# 문제 검증: dmv-permit-pennsylvania (Pennsylvania DMV Permit Test)

- 날짜: 2026-10-17 (매일 자격증 추가 루틴, 새벽)
- 방법: answer·explanation·oneLineConcept·choicesByLevel 을 뺀 파일(문제·선지·그림만)을 별도 에이전트가 처음부터 다시 풀고, PA 고유 수치는 pa.gov 검색 결과로 확인. 그림 문제는 `npm run images:render` PNG 를 보고 체크리스트 확인
- 시험 구성: pa.gov "Knowledge Test" 페이지 — 18문항 객관식, 15문항 이상 맞혀야 합격, 떨어지면 다음 영업일 재응시. 시간 제한은 공개되지 않아 연습 모의고사는 20분. pa.gov 는 실행 환경에서 직접 열리지 않아(프록시 403·DNS 실패) 검색 결과로 확인

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 88 | 85 | 3 | 0 |

## 수정 후 통과

- 그림 문제 3개(yield-sign, signal-ahead, no-passing-zone-pennant): 1차 검증에서 PNG 오른쪽이 잘림(① FAIL). SVG 에 width·height 가 없어 렌더 폭보다 크게 그려진 것 → viewBox 와 같은 width·height 를 넣고 다시 렌더, 새 검증 에이전트가 체크리스트 전체를 다시 확인해 통과. 정답은 1차·2차 모두 일치.

## 그림 (visualNeed high → 표지판 단원 1개)

| 그림 | ① | ② | ③ | ④/⑤ |
|---|---|---|---|---|
| yield-sign.svg (문제) | PASS | PASS | PASS | ④ PASS |
| signal-ahead.svg (문제) | PASS | PASS | PASS | ④ PASS |
| no-passing-zone-pennant.svg (문제) | PASS | PASS | PASS | ④ PASS |
| sign-shapes-chart.svg (개념 그림) | PASS | PASS | PASS | ⑤ PASS |

출처: MUTCD(FHWA) 표지판을 다시 그림 — 미국 연방정부 저작물(퍼블릭 도메인).

## 기출

- 기출 0 / AI 88.
- 기출 미수록 사유: PennDOT 실제 문제은행 비공개(매뉴얼 장 끝 연습 문제만 공개).

## 개념 정리

- 6단원 모두 1차 검증 PASS (pa.gov 검색으로 6점 규정·긴급차량 500ft 등 확인). 선택 의견 2건(Move Over 감속 수치, 면허 신청 서류)은 사실 오류가 아니라 그대로 둠.
