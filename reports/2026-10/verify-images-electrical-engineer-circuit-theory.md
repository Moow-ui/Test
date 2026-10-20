# 그림 검증: electrical-engineer · circuit-theory (전기기사 회로이론)

- 날짜: 2026-10-21 (새벽 루틴 그림 보강)
- 방법: 정답·해설을 뺀 문제와 `npm run images:render -- electrical-engineer` PNG 만 받은 별도 에이전트가 모두 다시 계산해 풀고 그림마다 체크리스트를 확인했다.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

| 그림 | 내용 | 체크리스트 |
|---|---|---|
| ac-rlc-series-8-10-4-100v | RLC 직렬 전류 10A | ① PASS ② PASS ③ PASS ④ PASS |
| ac-rlc-series-6-12-4 | RLC 직렬 역률 0.6 | ① PASS ② PASS ③ PASS ④ PASS |
| ac-rlc-parallel-15-10-20-120v | RLC 병렬 전체 전류 10A | ① PASS ② PASS ③ PASS ④ PASS |
| max-power-100v-5ohm | 최대 전력 500W | ① PASS ② PASS ③ PASS ④ PASS |
| thevenin-24v-6-3-2 | 테브난 등가 8V·4Ω | ① PASS ② PASS ③ PASS ④ PASS |
| bridge-2-4-4-8-5-24v | 평형 브리지 6A | ① PASS ② PASS ③ PASS ④ PASS |
| rc-transient-10v-10k-100uf | RC 시정수 1초 | ① PASS ② PASS ③ PASS ④ PASS |
| rl-transient-100v-20-4h | RL 과도 전류 약 3.16A | ① PASS ② PASS ③ PASS ④ PASS |
| impedance-triangle (개념) | 임피던스 삼각형 | ① PASS ② PASS ③ PASS ⑤ PASS |

- 출처: 모두 직접 그림(self).
