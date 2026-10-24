# 그림 검증: fire-facility-engineer-electrical · control-logic (자동 제어와 논리 회로)

- 날짜: 2026-10-25 (새벽 루틴 그림 보강)
- 방법: 정답·해설을 뺀 문제와 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고(불 대수는 진리표로 확인) 그림마다 체크리스트를 확인했다.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

- 다시 풀기 8/8 일치.
- logic-gate-nor-symbol.svg (NOR 기호): ① PASS ② PASS ③ PASS ④ PASS
- logic-xor-truth-table.svg (XOR 진리표): ① PASS ② PASS ③ PASS ④ PASS
- logic-and-or-abc.svg (A·B + C): ① PASS ② PASS ③ PASS ④ PASS
- logic-a-plus-nota-b.svg (A + A'B 간소화): ① PASS ② PASS ③ PASS ④ PASS
- logic-not-not-or.svg (드모르간, NAND): ① PASS ② PASS ③ PASS ④ PASS
- seq-parallel-a-contacts-lamp.svg (a 접점 병렬 = OR): ① PASS ② PASS ③ PASS ④ PASS
- seq-self-holding.svg (자기 유지): ① PASS ② PASS ③ PASS ④ PASS
- seq-interlock-r1-r2.svg (인터록): ① PASS ② PASS ③ PASS ④ PASS
- concept-self-holding-interlock.svg (개념 그림): ① PASS ② PASS ③ PASS ⑤ PASS
- 참고: 누름 버튼은 래더식 a·b 접점 기호 + 범례로 표기(국내 교재 표기, ② PASS).
