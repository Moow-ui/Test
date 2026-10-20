# 문제 검증: dmv-permit-north-carolina (North Carolina DMV Permit Test)

- 날짜: 2026-10-21 (매일 루틴, 새벽)
- 방법: 정답·해설·핵심 개념·오답 순서를 뺀 파일만 받은 별도 에이전트가 142문항을 모두 다시 풀었다. 그림 문제는 `npm run images:render -- dmv-permit-north-carolina` 로 만든 PNG 를 보고 풀었다.
  수치 문항 약 35개는 NC Driver's Handbook PDF(ncdot.gov, 현행)와 대조했다.
- 시험 구성: 19A NCAC 03B .0201 (law.cornell.edu 사본, oah.nc.gov 는 실행 환경에서 403) — 지식시험 80% 이상, 표지판 시험은 Class C 12개 중 9개 이상. NCDMV 시험 안내(ncdot.gov) — 시험마다 따로 합격, 불합격 시 7일 뒤 재시험.
  지식시험 문항 수·시간 제한은 공식 공지가 없어 연습 모의고사를 표지 12 + 규칙 25 = 37문항·30분으로 정하고 `format` 에 그렇게 밝혔다 (Texas 와 같은 방식). 모의고사는 두 부분 모두 80% 기준이라 표지판은 10/12 로 실제보다 1문제 엄격하며 `description` 에 적었다.

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 142 | 142 | 0 | 0 |

- 다시 풀기 142/142 일치, 플래그 0.
- 검증 뒤 정답 위치가 1→2→3→4 로 되풀이되는 것을 발견해, 선지 내용은 그대로 두고 선지 순서만 섞었다(levelLock·다른 선지를 가리키는 16문항 제외). 섞은 뒤 검증 에이전트가 고른 선지의 글과 정답 선지의 글이 142/142 같음을 스크립트로 확인.
- 작성 때 뺀 것(공식 자료로 확인 못 함): 지식시험 실제 문항 수·시간, 스쿨존 제한속도 값, 자전거 추월 거리, 공사구간 벌금액, 성인 핸즈프리 규정, 홍수 수심 수치.

## 그림 (visualNeed high, 3단원)

- 문제 그림 9 + 개념 그림 3. 표지판은 MUTCD(미국 연방정부 저작물, 퍼블릭 도메인), 노면 표시·신호는 직접 그림.

| 그림 | 체크리스트 |
|---|---|
| yield · keep-right · no-left-turn (regulatory-signs) | ① PASS ② PASS ③ PASS ④ PASS |
| school-pentagon · two-way-traffic · slippery-when-wet (warning-signs) | ① PASS ② PASS ③ PASS ④ PASS |
| edge-line-colors · red-ball-green-arrow · no-turn-on-red (signals-markings) | ① PASS ② PASS ③ PASS ④ PASS |
| regulatory-sign-types · no-passing-signs · yellow-white-lines (개념) | ① PASS ② PASS ③ PASS (⑤ 개념 정리 검증에서 확인) |

## 기출

- 기출 0 / AI 142.
- 기출 미수록 사유: NCDMV 의 Sample Test Questions 페이지는 문제 목록 API 가 401 로 내용을 읽을 수 없고, 실제 문제은행은 비공개. NCDOT 이용약관은 비상업적·변경 없는 복제만 허용 → 이용 조건 불가.

## 개념 정리

- 9단원 모두 1차 검증 PASS (검증 기록 `reports/2026-10/concepts-verify/verify-dmv-permit-north-carolina.json`, NC Driver's Handbook 2025.5 개정판·NCDMV Level 1~3 페이지·MUTCD 2023 대조).
- 검증 의견에 따라 핸드북과 표현이 너무 비슷한 2문장(홀수·짝수 도로 번호, 45 mph 이상 200피트 신호)과 표현 3곳(우선권 문장, 스쿨버스 벌점 "가장 큼" → "가장 큰 것 중 하나")을 고쳤고, 고친 5문장은 별도 에이전트가 다시 확인해 모두 PASS.
