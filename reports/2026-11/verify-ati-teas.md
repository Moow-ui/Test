# 문제 검증: ati-teas (ATI TEAS, Version 7)

- 날짜: 2026-11-03 (매일 루틴, 새벽)
- 시험 구성 근거: ATI 공식 페이지 https://www.atitesting.com/teas/exam-details (WebFetch 직접 확인) — 170문항·209분, Reading 45(비채점 6)·55분, Mathematics 38(4)·57분, Science 50(6)·60분, English and Language Usage 37(4)·37분, 영역별 문항 수(Reading 15/9/15, Math 18/16, Science 18/9/8/9, English 12/11/10), 문항 형식(객관식·복수 선택·빈칸·순서·핫스팟). 합격 점수는 학교마다 정함 → 연습 목표 70% 로 표기.
- 방법: 정답·해설·핵심 개념·선지 줄이기 정보를 뺀 파일만 받은 별도 에이전트가 188문항을 모두 다시 풀었다(그림 문제는 `npm run images:render` PNG 로 풂).

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 188 | 185 | 3 | 0 |

- 다시 풀기: 188/188 정답 일치.
- 수정 후 통과 3 (정답 그대로, 표현만 고친 뒤 새 에이전트가 다시 풀어 1개 답 확인): reading 수면 표 나이 구간 겹침(13–18/18–60 → 13–17), science DNA 주형 가닥 방향(3′→5′) 명시, science 25 mL 측정 "exactly" → "as accurately as possible".
- 출제 현황: basic 76 · intermediate 66 · advanced 46, levelLock 3. 정답 위치 1·2·3·4 = 46·47·48·47.
- 기출 0 / AI 188. 기출 미수록 사유: ATI 는 실제 문제를 공개하지 않고 샘플 문제만 공개(저작권 ATI, 원문 전재 불가 → 이용 조건 불가).

## 그림 (visualNeed medium, 단원 measurement-data)

| 그림 | 문항 | 체크리스트 |
|---|---|---|
| bar-clinic-patients.svg | 요일별 환자 수 막대그래프 | ① PASS ② PASS ③ PASS ④ PASS |
| line-patient-temperature.svg | 체온 꺾은선그래프 | ① PASS ② PASS ③ PASS ④ PASS |
| pie-monthly-budget.svg | 월 예산 원그래프 | ① PASS ② PASS ③ PASS ④ PASS |

## 개념 정리

- 12단원 1차 전부 PASS. 표현 메모 3건을 고친 뒤 그 3단원(craft-structure·biology·knowledge-of-language)만 새 에이전트 재검증 PASS. keyPoints·학습 팁 PASS. 개념 그림 concept-mean-median-dot-plot.svg ① PASS ② PASS ③ PASS ⑤ PASS. 기록: concepts-verify/verify-ati-teas.json
