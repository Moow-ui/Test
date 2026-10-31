# 그림 보강 검증: industrial-safety-industrial-engineer · safety-organization

- 날짜: 2026-11-01 (새벽 루틴 그림 보강)
- 근거: 산업안전보건법 시행규칙(2026-08-01 시행, law.go.kr lsiSeq=288431) 별표6(표지 종류·형태)·별표7(용도·형태·색채)·별표8(색도기준)·별표9(기본모형). 별표 그림·PDF 를 law.go.kr 에서 직접 내려받아 대조.
- 방법: 정답·해설을 뺀 문제와 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 8 | 8 | 0 |

| 그림 | 문항 | 체크리스트 |
|---|---|---|
| sign-shapes-abcd-guidance.svg | 안내표지 모양 고르기 | ① PASS ② PASS ③ PASS ④ PASS |
| sign-shape-red-circle-slash.svg | 금지표지 모양 | ① PASS ② PASS ③ PASS ④ PASS |
| sign-shape-red-diamond.svg | 마름모 경고표지(인화성물질) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-warning-danger-place.svg | 위험장소 경고 바탕색 색도기준 | ① PASS ② PASS ③ PASS ④ PASS |
| sign-prohibition-dimensions.svg | 금지표지 사선 폭(별표9) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-guidance-first-aid.svg | 응급구호표지와 같은 분류 | ① PASS ② PASS ③ PASS ④ PASS |
| sign-warning-two-shapes.svg | 삼각형 경고표지(방사성물질) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-shape-blue-circle.svg | 지시표지(보안경 착용) | ① PASS ② PASS ③ PASS ④ PASS |

- 다시 풀기 8/8 일치. 정답 위치 2·3·4·1·2·4·3·1.
- 개념 그림 sign-categories-overview.svg: ① PASS ② PASS ③ PASS ⑤ PASS (검증 의견대로 캡션 근거를 "별표6~8" → "별표6~9"로 고침).
- 메모: 단원 개념 정리에 마름모 경고표지(별표7, 201~205·214)·빨간색의 화학물질 경고 용도 문장이 없음 — 단원 글 보강은 다음 개념 정리 손볼 때(재검증 필요).
