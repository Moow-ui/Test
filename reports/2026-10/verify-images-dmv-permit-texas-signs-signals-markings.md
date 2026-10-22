# 그림 검증: dmv-permit-texas · signs-signals-markings

- 날짜: 2026-10-23 (새벽 루틴 그림 보강)
- 방법: 그림을 만든 에이전트와 다른 에이전트가 `npm run images:render -- dmv-permit-texas` PNG 와 정답을 뺀 문제만 보고 다시 풀고 체크리스트를 확인. 그린 쪽이 확신이 없다고 적은 R15-1·W6-1 은 루틴 실행 모델이 PNG 를 직접 보고 MUTCD 표준 모양과 한 번 더 대조.
- 출처: MUTCD 표지(미국 연방정부 저작물, 퍼블릭 도메인)를 옮겨 그림.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

다시 풀기 8/8 일치.

| 그림 | 체크리스트 |
|---|---|
| stop-ahead (W3-1) | ① PASS ② PASS ③ PASS ④ PASS |
| signal-ahead (W3-3) | ① PASS ② PASS ③ PASS ④ PASS |
| crossbuck (R15-1) | ① PASS ② PASS ③ PASS ④ PASS |
| merge (W4-1) | ① PASS ② PASS ③ PASS ④ PASS |
| divided-highway-begins (W6-1) | ① PASS ② PASS ③ PASS ④ PASS |
| cross-road (W2-1) | ① PASS ② PASS ③ PASS ④ PASS |
| keep-right (R4-7) | ① PASS ② PASS ③ PASS ④ PASS |
| wrong-way (R5-1a) | ① PASS ② PASS ③ PASS ④ PASS |
| 개념 그림 sign-shapes | ① PASS ② PASS ③ PASS ⑤ PASS |

- 참고: 검증 에이전트는 MUTCD 를 기억으로 대조(FHWA 그림 페이지를 직접 열지 않음). 개념 그림의 오각형 학교 표지는 형광 황록색(MUTCD 허용 색).
