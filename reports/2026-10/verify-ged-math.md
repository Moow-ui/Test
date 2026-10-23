# 문제 검증: ged-math (GED Mathematical Reasoning)

- 날짜: 2026-10-24 (매일 루틴, 새벽)
- 시험 구성 근거: ged.com Test Subjects(115분, 2부, 3분 휴식, 공식 표·화면 계산기, 합격 145/200), GED Assessment Guide for Educators: Mathematical Reasoning(양적 문제 해결 약 45% · 대수 문제 해결 약 55%, 출제 목표 Q.1~Q.8·A.1~A.7, TI-30XS, 공식 표), GED Technical Manual 2022(시간 115분). 문항 수는 ged.com 에 공개되어 있지 않아 이 사이트 실전은 46문항(양적 21·대수 25, 45:55 비율)으로 하고 meta 에 그렇게 밝힘. 합격선은 척도 점수라 % 로 바꿀 수 없어 연습 목표 65% 로 표시(ASVAB 와 같은 방식).
- 방법: 정답·해설·한 줄 개념·선지 줄이기를 뺀 파일만 받은 별도 에이전트가 139문항을 모두 다시 풀었다(계산은 Python 으로 재확인). 1차에서 정답 위치가 규칙적으로 돌아가는 것이 드러나, 선지 순서를 무작위로 섞은 뒤 새 에이전트가 처음부터 다시 풀었다(2차).

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 139 | 139 | 0 | 0 |

- 다시 풀기: 1차 139/139, 2차(선지 순서 섞은 뒤) 139/139 일치. 낮은 확신 0.
- 기출 0 / AI 139. 기출 미수록 사유: GED 시험 문제는 비공개이고, 공개된 샘플 문제는 저작권이 GED Testing Service 에 있어 원문 전재 불가.
- 출제 현황: 초급 56 · 중급 103 · 고급 83, 실전 문제풀이(46문항) 가능(`check:cert` 통과). levelLock 0.
- 그림 (visualNeed medium, 그래프·기울기·함수 단원): 문제 그림 3 + 개념 그림 1.
  - ged-points-quadrants.svg: ① PASS ② PASS ③ PASS ④ PASS
  - ged-line-two-points.svg: ① PASS ② PASS ③ PASS ④ PASS (2차 검증에서 선이 눈금 숫자 "−2"를 가린다는 지적 → 눈금 숫자를 선 위에 흰 테두리로 옮긴 뒤 ① 재확인)
  - ged-cost-hours.svg: ① PASS ② PASS ③ PASS ④ PASS
  - ged-slope-concept.svg (개념 그림): 같은 수정 후 개념 정리 검증에서 ①②③⑤ 확인
