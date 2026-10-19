# 그림 보강 검증: cdl-air-brakes · system-parts

- 날짜: 2026-10-20 (새벽 루틴 그림 보강)
- 근거 자료: New York State CDL Manual (CDL-10) Section 5 Air Brakes — https://dmv.ny.gov/brochure/cdl10sec05.pdf
- 방법: 정답·해설을 뺀 문제와 `npm run images:render -- cdl-air-brakes` PNG 만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

- 다시 풀기 8/8 일치.

| 그림 | 체크리스트 |
|---|---|
| scam-drum-brake-letters | ① PASS ② PASS ③ PASS ④ PASS |
| scam-brake-linkage-letters | ① PASS ② PASS ③ PASS ④ PASS |
| air-system-flow-letters | ① PASS ② PASS ③ PASS ④ PASS |
| air-tank-valves-letters | ① PASS ② PASS ③ PASS ④ PASS (문제 2개에 사용) |
| supply-gauge-100-psi | ① PASS ② PASS ③ PASS ④ PASS |
| supply-gauge-50-psi | ① PASS ② PASS ③ PASS ④ PASS |
| parking-brake-knob | ① PASS ② PASS ③ PASS ④ PASS |
| air-brake-system-overview (개념) | ① FAIL (가로로 넓은 그림이라 화면 높이 제한에 줄어 글자가 휴대폰에서 6~7px) ② PASS ③ PASS ⑤ PASS → 넣지 않음 |

- 개념 그림 0 (체크리스트 ① FAIL 로 제외). 세로로 다시 그리면 다음에 보강할 수 있다.
