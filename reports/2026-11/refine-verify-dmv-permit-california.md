# 내용 다듬기 검증: dmv-permit-california (California DMV Permit Test)

- 날짜: 2026-11-04 (새벽 루틴, 내용 다듬기)
- 방법: 새로 쓰거나 고친 문장만 모은 파일(65문장: 요약 5 · 요점 30 · 함정 trap 15 · fact 15)과 그 단원 문제(정답·해설 포함), 공식 출처(California Driver's Handbook https://www.dmv.ca.gov/portal/handbook/california-driver-handbook/)만 받은 별도 에이전트가 문장마다 ① 사실 ② 문제 정답·해설과 일치 ③ trap 이 정말 틀린 생각인가 ④ 근거 없는 수치 를 확인.

| 문장 | 통과 | 수정 후 통과 | 뺌 |
|---|---|---|---|
| 65 | 63 | 2 | 0 |

## FAIL → 수정

- 45 (safe-driving 요점), 47 (safe-driving 함정 fact): 스쿨버스 예외를 "중앙분리대가 있는 분리 도로 건너편"만 적음 → CVC 22454(b)·문항 safe-driving-0015 해설대로 "분리 도로 또는 편도 2차로 이상 다차로 도로 건너편"으로 고침. 같은 단원 summary 의 "school buses on divided highways" 도 "school buses with flashing red lights" 로 고침. 고친 3문장은 새 에이전트가 다시 확인해 3/3 PASS.

## 그 밖

- 기준 연도: 핸드북 페이지 200, 2026 판(본문 확인) → `basisYear: 2026`.
- 단원 페이지 합치기: 5단원 모두 개념 정리 검증(verifiedAt 2026-10-04) 있음 → `mergedAt` 로 /concepts/{단원} 에 합침. 함정이 있는 단원이라 시험 포인트에만 있던 사실은 요점에 옮김.
- 그림 보강: reports/image-progress.md "다음 할 일"에 이 자격증 단원이 없어 하지 않음.
