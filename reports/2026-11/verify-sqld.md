# 문제 검증: sqld (SQL 개발자, SQLD)

- 날짜: 2026-11-01 (매일 루틴, 새벽)
- 시험 구성 근거: 데이터자격검정 SQLD 안내(https://www.dataq.or.kr/www/sub/a_04.do, WebFetch 로 직접 확인) — 1과목 데이터 모델링의 이해 10문항(20점), 2과목 SQL 기본 및 활용 40문항(80점), 객관식 50문항 90분, 총점 60점 이상·과목별 40% 미만 과락, 유효기간 2년(보수교육 이수 시 영구). 응시 유의사항(warning.do): 시험시간 10:00~11:30, 계산기 불가, 시험정보 비공개. 보기 수는 공지에 없어 같은 기관 ADsP 와 같은 4지선다로 연습(meta 에 그대로 밝힘). curl 로는 dataq.or.kr 가 열리지 않아 WebFetch 로 확인.
- 방법: 정답·해설·핵심 개념·choicesByLevel 을 뺀 파일만 받은 별도 에이전트가 150문항을 모두 다시 풀었다. 이식 가능한 쿼리 약 30개는 sqlite3 로 실행해 확인, Oracle 전용 문법(ROWNUM·CONNECT BY·ROLLUP/CUBE/GROUPING SETS·PIVOT·MERGE·DDL 자동 커밋 등)은 Oracle 동작 기준으로 손으로 확인. 그림 문제는 `npm run images:render` PNG 로 풀었다.

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 150 | 148 | 1 | 1 |

- 다시 풀기: 150/150 정답 일치.
- 수정 후 통과 1: 주문·주문상세 ERD 그림 — 고객–주문 점선이 기호에 가려 실선처럼 보임(② FAIL) → 선을 길게 고친 뒤 새 에이전트가 체크리스트 전체 재검증 PASS·다시 풀기 일치.
- 탈락 1: 계좌이체 출금·입금 관계(필수/선택) 문항 — 근거가 교재 예시에 기대 다툼 여지가 있어 `data/review-queue/sqld.json` 보관.
- 메모(통과): 중심 엔터티 분류 문항은 교재 분류 기준을 따른 것으로 정답 하나.
- 출제 현황: basic 47 · intermediate 63(levelLock 3) · advanced 39(levelLock 10). 정답 위치 1·2·3·4 = 37·38·37·37.
- 기출 0 / AI 149. 기출 미수록 사유: 시행기관이 시험정보(문제·답안) 비공개.

## 그림 (visualNeed medium, 단원 data-modeling)

| 그림 | 문항 | 체크리스트 |
|---|---|---|
| erd-dept-emp-zero-many.svg | 0개 이상·선택 관계 읽기 | ① PASS ② PASS ③ PASS ④ PASS |
| erd-order-detail-identifying.svg | 식별/비식별 관계 | 1차 ② FAIL(점선이 실선처럼 보임) → 수정 후 ① PASS ② PASS ③ PASS ④ PASS |
| erd-employee-self-relation.svg | 순환(재귀) 관계 | ① PASS ② PASS ③ PASS ④ PASS |

## 개념 정리

- 5단원 1차 전부 PASS (concepts-verify/verify-sqld.json). 개념 그림 ie-notation-symbols.svg ① PASS ② PASS ③ PASS ⑤ PASS.
