# 그림 검증: dmv-permit-new-york · road-signs

- 날짜: 2026-10-31 (새벽 루틴 그림 보강)
- 방법: 정답·해설을 뺀 문제와 `npm run images:render -- dmv-permit-new-york` PNG 만 받은 별도 에이전트가 다시 풀고 체크리스트 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

| 그림 | MUTCD | 체크리스트 |
|---|---|---|
| signal-ahead.svg | W3-3 Signal Ahead | ① PASS ② PASS ③ PASS ④ PASS |
| stop-ahead.svg | W3-1 Stop Ahead | ① PASS ② PASS ③ PASS ④ PASS |
| merging-traffic.svg | W4-1 Merge (오른쪽에서 합류) | ① PASS ② PASS ③ PASS ④ PASS |
| t-intersection.svg | W2-4 T Intersection | ① PASS ② PASS ③ PASS ④ PASS |
| wrong-way.svg | R5-1a Wrong Way | ① PASS ② PASS ③ PASS ④ PASS |
| one-way-right.svg | R6-1R One Way | ① PASS ② PASS ③ PASS ④ PASS |
| do-not-pass.svg | R4-1 Do Not Pass | ① PASS ② PASS ③ PASS ④ PASS |
| no-left-turn.svg | R3-2 No Left Turn | ① PASS ② PASS ③ PASS ④ PASS |
| sign-shapes.svg (개념 그림) | 표지 모양·색 | ① PASS ② PASS ③ PASS ⑤ PASS |

- 다시 풀기 8/8 일치. 출처: MUTCD(미국 연방정부 저작물, 퍼블릭 도메인).
