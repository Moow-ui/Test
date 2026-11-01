# 그림 보강 검증: dmv-permit-pennsylvania · signs-signals-markings

- 날짜: 2026-11-02 (새벽 루틴 그림 보강)
- 근거: FHWA MUTCD 11th Edition (mutcd.fhwa.dot.gov 에서 PDF 를 받아 그림 대조: Fig 2B-3·2B-4·2B-13·2B-28·2C-1·2C-6·2C-7·2C-10). 미국 연방정부 저작물(public domain).
- 방법: 정답·해설을 뺀 문제와 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 6 | 2 |

| 그림 | MUTCD | 체크리스트 |
|---|---|---|
| pa-do-not-enter.svg | R5-1 | ① PASS ② PASS ③ PASS ④ PASS |
| pa-speed-limit-45.svg | R2-1 | ① PASS ② PASS ③ PASS ④ PASS |
| pa-bump.svg | W8-1 | ① PASS ② PASS ③ PASS ④ PASS |
| pa-narrow-bridge.svg | W5-2 | ① PASS ② PASS ③ PASS ④ PASS |
| pa-side-road-right.svg | W2-2 | ① PASS ② PASS ③ PASS ④ PASS |
| pa-no-u-turn.svg | R3-4 | ① PASS ② PASS ③ PASS ④ PASS |
| pa-curve-right.svg (탈락) | W1-2R 로 적음 | ② ③ ④ FAIL — 화살표가 두 번 꺾여 Reverse Curve(W1-4R) 모양. 게시하지 않음 |
| pa-no-turn-on-red.svg (탈락) | R10-11 로 적음 | ② FAIL — R10-11 은 4줄(NO/TURN/ON/RED) 세로형, 3줄 정사각형은 R10-11b. 게시하지 않음 |

- 다시 풀기: 8/8 정답 일치 (탈락 2건은 그림 모양 때문).
- 메모: PNG 아래쪽 여백이 넓다는 의견(① PASS).
