# 그림 검증: electrical-industrial-engineer · ac-circuit (직류·교류 회로)

- 날짜: 2026-10-29 (새벽 루틴 그림 보강)
- 방법: `npm run images:render -- electrical-industrial-engineer` 로 만든 PNG 와 정답을 뺀 문제만 받은 별도 에이전트가 8문항을 다시 풀고(계산 재확인), 그림마다 체크리스트를 확인했다.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

- 다시 풀기 8/8 일치 (직병렬 전체 전류·분류, R-L 직렬 전류·역률, R-L-C 직렬 임피던스·유효 전력, R-C 병렬 전체 전류, 직렬 공진 전류).

| 그림 | 문제 | 체크리스트 |
|---|---|---|
| dc-series-parallel-2-6-3-20v | 2 | ① PASS ② PASS ③ PASS ④ PASS |
| ac-rl-series-6-8-100v | 2 | ① PASS ② PASS ③ PASS ④ PASS |
| ac-rlc-series-3-9-5-50v | 2 | ① PASS ② PASS ③ PASS ④ PASS |
| ac-rc-parallel-20-15-60v | 1 | ① PASS ② PASS ③ PASS ④ PASS |
| ac-rlc-resonance-5-10-10-100v | 1 | ① PASS ② PASS ③ PASS ④ PASS |
| ac-impedance-triangle-rlc (개념 그림) | — | ① PASS ② PASS ③ PASS ⑤ PASS |

- 출처: 모두 직접 그림(self).
