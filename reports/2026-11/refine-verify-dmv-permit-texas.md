# 내용 다듬기 검증: dmv-permit-texas (Texas DMV Permit Test)

- 날짜: 2026-11-06 (새벽 루틴, 내용 다듬기)
- 방법: 새로 쓰거나 고친 문장만 모은 파일(49항목 = 64문장: 요약 추가 5 · 요점 29 · 함정 trap 15 · fact 15)과 그 단원 문제(정답·해설 포함), 공식 출처(Texas Driver Handbook DL-7, https://www.dps.texas.gov/internetforms/getForm.ashx?id=DL-7.pdf)만 받은 별도 에이전트가 문장마다 ① 사실 ② 문제 정답·해설과 일치 ③ trap 이 정말 틀린 생각인가 ④ 근거 없는 수치 를 확인. statutes.capitol.texas.gov 는 본문이 열리지 않아 Transportation Code 조문은 검증 에이전트 지식으로 확인.

| 항목 | 통과 | 수정 후 통과 | 뺌 |
|---|---|---|---|
| 49 | 46 | 3 | 0 |

## FAIL → 수정

- laws-licensing-alcohol 요점: 측정 거부 2년 정지를 "10년 안에 이전 거부가 있을 때"로만 적음 → §724.035(b)대로 "10년 안에 음주·약물 관련 기록(이전 거부·측정 불합격·DWI 유죄)이 있을 때"로 고침.
- safe-driving-sharing-road 함정 fact·요점: 스쿨버스 예외를 "분리 도로 건너편만"으로 적음(§545.066 의 또 다른 예외 — 보행자 횡단이 금지된 출입 제한 도로의 승하차 구역 — 누락), 요점은 버스 출발·등 꺼짐·운전자 신호로 출발할 수 있다는 점이 빠져 보임 → 고침.
- 고친 3문장은 새 에이전트가 다시 확인해 3/3 PASS.

## 그 밖

- 오류 발견(문제, 이번에 고치지 않음): 문항 dmv-permit-texas-laws-licensing-alcohol-0011 해설의 2년 정지 조건도 "이전 거부"로만 적혀 범위가 좁다(정답은 그대로 맞음). 다듬기는 문제 내용을 바꾸지 않으므로 기록만 한다 — 고칠 때 version 을 올리고 다시 검증.
- 기준 연도: DL-7 "Revised January 2026"(dps.texas.gov 에서 직접 받음) → `basisYear: 2026`.
- 단원 페이지 합치기: 5단원 모두 개념 정리 검증(verifiedAt 2026-10-04) 있음 → `mergedAt` 로 /concepts/{단원} 에 합침. 함정이 있는 단원이라 시험 포인트에만 있던 사실은 요점에 옮김. concepts.json 은 고치지 않음.
- 그림 보강: reports/image-progress.md "다음 할 일"에 이 자격증 단원이 없어 하지 않음.
