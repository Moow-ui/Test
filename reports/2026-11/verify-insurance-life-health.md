# 문제 검증 — insurance-life-health (Life and Health Insurance License Exam)

- 날짜: 2026-11-05 (새벽 루틴)
- 작성: AI 예상문제 170 (생명 83 · 건강 87). 기출 0 — 기출 미수록 사유: 시험 대행사(Pearson VUE·PSI 등) 문제은행 비공개(공개 기출 없음).
- 시험 구성 근거: Pearson VUE Texas Insurance Content Outlines (2026-09-01 시행, 124401.pdf) "Life and Health — General Knowledge" 100문항(+사전 시험 10): 생명 I 15 · II 15 · III 12 · IV 8, 건강 V 16 · VI 15 · VII 6 · VIII 5 · IX 8.
  Texas Insurance Licensing Candidate Handbook (2024-10, 124400.pdf): General Lines Life, Accident & Health 150분, 주 법규 30(+5), 척도 점수 70 합격, 재응시 제한 없음. pearsonvue.com 에서 직접 받아 확인.
- 검증: 작성과 분리된 별도 에이전트 2개(생명·건강)가 정답을 가린 파일로 먼저 전부 풀고 → 줄인 선지(초급 2·중급 3)에서도 답이 하나인지 확인 → 그 뒤 정답·해설 대조.

| | 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|---|
| 생명 (4단원) | 83 | 83 | 0 | 0 |
| 건강 (5단원) | 87 | 87 | 0 | 0 |
| 합계 | 170 | 170 | 0 | 0 |

- 불일치 문항: 없음 (83/83, 87/87).
- 표현 메모(오류 아님, 고치지 않음): 생명 Q14 선지 2·3이 같은 말로 시작, Q56 오답 설명 각도, Q60 HIV 검사 동의는 주 법(문제에 "usually"), 건강 Q36 해설 "age (or gender)" — NAIC 모델은 나이만.
- 넣을 때 고친 것: `oneLineConcept` 4개가 70자를 넘어 줄임(뜻 같음, 정답·문제·선지 변경 없음).
- 난이도: basic 69 · intermediate 59 · advanced 42. levelLock 0. check:cert 초급 69 · 중급 128 · 고급 101, 실전 가능.
- 그림 0 (visualNeed none: 보험 상품·약관 지식이라 그림이 필요한 단원 없음).
- 요점 고침: 작성 에이전트 의견으로 health-provisions-riders 요점 2개(항변 제한 기간 "2년(일부 주 3년)", 소송 기한 "증명 제출 기한부터 3년")를 정확하게 고침.
