# 그림 검증: forklift-operator · safety-signs (보호구와 안전표지)

- 날짜: 2026-10-19 (새벽 루틴 그림 보강)
- 원본: 산업안전보건법 시행규칙(고용노동부령, 2026-08-01 시행) 별표 6 안전보건표지의 종류와 형태·별표 8 색도기준·별표 9 기본모형 — law.go.kr 공개 API 에서 PDF 를 직접 받아 대조 (작성·검증 에이전트 각각 따로 받음).
- 방법: 정답을 뺀 문제와 렌더 PNG(`npm run images:render -- forklift-operator`)만 받은 별도 에이전트가 다시 풀고, 그림마다 체크리스트를 확인.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 6 | 5 | 1 |

- 다시 풀기 6/6 일치.
- 탈락 1: 녹십자표지(401) 그림 — 십자 팔 두께가 원본보다 거의 두 배 굵어 응급구호표지처럼 보임(② FAIL). 문제와 그림 모두 넣지 않음.

| 그림 | 체크리스트 |
|---|---|
| sign-warning-high-voltage (207 고압전기 경고) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-warning-danger-zone (215 위험장소 경고) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-mandatory-safety-helmet (305 안전모 착용) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-guide-first-aid (402 응급구호표지) | ① PASS ② PASS ③ PASS ④ PASS |
| signs-four-labeled (215·402·305·207 묶음) | ① PASS ② PASS ③ PASS ④ PASS |
| sign-guide-green-cross (401 녹십자표지) | ① PASS ② FAIL(십자 팔 두께) ③ PASS ④ PASS → 넣지 않음 |
| sign-groups-shape-color (개념 그림) | ① PASS ② PASS ③ PASS ⑤ PASS |
