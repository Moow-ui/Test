# 그림 검증: electrician-craftsman · ac-circuit (교류회로)

- 날짜: 2026-10-27 (새벽 루틴 그림 보강)
- 방법: 정답·해설을 뺀 문제와 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 문제 그림 8 + 개념 그림 1 | 문제 8 | 개념 그림 1 (게시 안 함) |

- 다시 풀기: 8/8 일치 (주기 20ms→50Hz, 최댓값 141V→실효값 약 100V, 전류 90° 뒤짐→L 회로, RLC 직렬 Z=10Ω·20A, 임피던스 삼각형 역률 0.6, 페이저 합성 100V, R-L 병렬 5A, R-C 직렬 VR 80V).
- ac-sine-period-20ms.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-sine-peak-141v.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-phase-current-lags-90.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-rlc-series-8-10-4-200v.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-impedance-triangle-12-16-20.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-phasor-rlc-60-120-40v.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-rl-parallel-30-40-120v.svg: ① PASS ② PASS ③ PASS ④ PASS
- ac-rc-series-40-30-100v.svg: ① PASS ② PASS ③ PASS ④ PASS
- 개념 그림 ac-impedance-triangle-concept.svg: ① FAIL(가로로 넓어 휴대폰 폭에서 보조 글자가 너무 작음) ② PASS ③ PASS ⑤ PASS → 넣지 않음.
