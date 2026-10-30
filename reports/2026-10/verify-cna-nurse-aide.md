# 문제 검증: cna-nurse-aide (Certified Nursing Assistant (CNA) Exam — NNAAP written 기준)

- 날짜: 2026-10-31 (매일 루틴, 새벽)
- 시험 구성 근거: NNAAP Written (Knowledge) Examination — 70문항(채점 60 + 비채점 10), 2시간, 2024 content outline(Physical Care Skills 38 · Psychosocial Care Skills 6 · Role of the Nurse Aide 16). credentia.com 직접 접속이 막혀 응시 안내서·outline 은 검색 결과로 확인(합계 60문항·100% 일치). 합격 기준은 주마다 정하므로 연습 목표 70% 로 표시. ncsbn.org/nnaap-and-mace.htm 직접 확인(NCSBN 은 NNAAP 내용을 더 이상 개발·소유하지 않음, Credentia 담당).
- 법령: eCFR API 로 42 CFR 483.10·483.12(학대 의심 2시간·그 밖 24시간·결과 5 working days)·483.35(d)(연속 24개월 미근무 시 재교육·재평가)·483.95(g)(연 12시간 이상 보수교육)·483.152(75시간·실습 16시간 이상)·483.154 원문 확인.
- 방법: 정답·해설·핵심 개념·choicesByLevel 을 뺀 파일만 받은 별도 에이전트가 141문항을 모두 다시 풀었다. 그림 문제는 `npm run images:render` 로 만든 PNG 를 보고 풀었다.

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 141 | 141 | 0 | 0 |

- 다시 풀기: 141/141 일치, 지적 0 (표현 메모 1건: 3번 '옆으로 눕히고 고개를 한쪽으로'는 같은 말을 두 번 하지만 정답은 하나로 분명해 그대로 둠).
- 출제 현황: basic 41 · intermediate 57 · advanced 32 · levelLock(advanced, EXCEPT형) 11. 정답 위치 1·2·3·4 = 33·34·36·38.
- 기출 0 / AI 141. 기출 미수록 사유: NNAAP 등 시험 대행사(Credentia·Prometric·Pearson VUE·Headmaster/D&S) 문제은행 비공개, 42 CFR 483.154(b)(1)(iv) 가 문제 공개를 막도록 요구. 연습 문제지는 대행사 저작권(이용 조건 불가).

## 그림 (visualNeed medium, 단원 positioning-mobility)

| 그림 | 문항 | 체크리스트 |
|---|---|---|
| fowlers-position.svg | Fowler's 자세 | ① PASS ② PASS ③ PASS ④ PASS |
| lifting-from-floor.svg | 바닥의 물건 들기 | ① PASS ② PASS ③ PASS ④ PASS |
| wheelchair-placement.svg | 휠체어 놓는 위치(건강한 쪽) | ① PASS ② PASS ③ PASS ④ PASS (아래 설명 글이 작지만 휴대폰 폭에서 읽힘) |

## 개념 정리

- 12단원: 1차 12 PASS (eCFR API 로 483.10·483.12·483.152·483.156·483.35·483.95 대조). 개념 그림 body-mechanics-compare.svg ① PASS ② PASS ③ PASS ⑤ PASS. (concepts-verify/verify-cna-nurse-aide.json)
