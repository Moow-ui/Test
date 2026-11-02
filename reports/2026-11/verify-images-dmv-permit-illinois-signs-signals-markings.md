# 그림 보강 검증: dmv-permit-illinois · signs-signals-markings

- 날짜: 2026-11-03 (새벽 루틴 그림 보강)
- 근거: FHWA MUTCD 11th Edition (mutcd.fhwa.dot.gov 에서 PDF 를 받아 그림 대조: Fig 2B-1·2B-10·2C-8·2C-11·2C-15·7B-1). 미국 연방정부 저작물(public domain).
- 방법: 정답·해설을 뺀 문제와 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 6 | 6 | 0 |

| 그림 | MUTCD | 체크리스트 |
|---|---|---|
| il-yield.svg | R1-2 | ① PASS ② PASS ③ PASS ④ PASS |
| il-stop-ahead.svg | W3-1 | ① PASS ② PASS ③ PASS ④ PASS |
| il-lane-ends.svg | W4-2 | ① PASS ② PASS ③ PASS ④ PASS |
| il-keep-right.svg | R4-7 | ① PASS ② PASS ③ PASS ④ PASS |
| il-pedestrian.svg | W11-2 | ① PASS ② PASS ③ PASS ④ PASS |
| il-school.svg | S1-1 | ① PASS ② PASS ③ PASS ④ PASS |

- 다시 풀기: 6/6 정답 일치.
- 메모: W3-1 화살표가 원본보다 조금 크다(테두리에 닿지 않아 ① PASS). PNG 아래쪽 여백은 렌더링 크기 때문이고 SVG 에는 영향 없음.
