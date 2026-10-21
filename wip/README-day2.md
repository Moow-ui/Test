# social-worker-1 이틀 나눔 — 1일차(2026-10-22) 끝난 것 / 2일차 할 것

## 끝난 것
- meta.json·chapters.json (3과목 8영역, 2027 제25회 시행계획 공고 기준). addedAt·updatedAt 은 게시하는 날로 고칠 것. studyTips·content.studyTip 은 TODO.
- 2026년 제24회 시험문제지 200문항 옮겨 적기(Sonnet, 원문 PDF 이미지로 20곳 교정) → wip/past24-with-key.json
- 정답: 최종정답 HWP 안 그림 3장을 읽어 wip/key24.json 대신 past24-with-key.json 의 answer 로 넣음 (1교시 50·2교시 75·3교시 75)
- 해설·난이도·choicesByLevel/levelLock: wip/explained-s1.json(50), explained-s2.json(75), explained-s3.json(75)
- 법령 현행 확인(3교시 작성 에이전트, law.go.kr DRF): 3교시 24번(아동수당법 제4조 2026.3.20 개정)·75번(사회복지공동모금회법 제18조 2026.3.31 삭제) LAW-CHANGED → 싣지 않음(review-queue 에 사유와 함께)
  - 참고: 3교시 66번 국민연금법 제19조 2026.10.20 개정·2027 시행(시행일이 2027-01-16 시험 전인지 확인), 70번 기관명 국가아동권리보장원으로 바뀜(해설 표기 확인)
  - 2교시 47번: 작성 에이전트 의견(ㄹ 문구 모호) — 분리 검증에서 확인

## 2일차 할 것
1. 분리 검증(정답 뺀 파일 + 원문 PDF 페이지): 문제·선지 글자 대조 → 다시 풀기 → 최종정답과 대조. 해설 검토. 탈락은 data/review-queue/social-worker-1.json
2. 초급·중급·고급 30 이상·실전(과목별 50/75/75) 확인 — 24·75 제외로 3교시가 73문항이면 실전 75 를 채우기 위해 정책과 제도 예상문제 필요(최소 2 + 여유)
3. 개념 정리(8단원) 작성 → 분리 검증, 운영진 학습 팁 3개
4. reviewedAt, questions:add, validate·check:cert·test·build·check:meta → cert: add social-worker-1 (대기 목록 항목 통째로 삭제 = split 사라짐)
