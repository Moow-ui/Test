# 문제 검증: aws-cloud-practitioner (AWS Certified Cloud Practitioner, CLF-C02)

- 날짜: 2026-11-02 (매일 루틴, 새벽)
- 시험 구성 근거: aws.amazon.com 자격증 페이지(WebFetch 직접 확인) — 65문항·90분·multiple choice 또는 multiple response·100 USD·Pearson VUE 시험장/온라인, 이탈리아어·독일어판 2026-12-31 이후 은퇴. 시험 안내서(docs.aws.amazon.com)는 실행 환경에서 접속이 막혀 공식 안내서 검색 결과로 확인 — 채점 50·비채점 15, 100~1,000 환산 점수 700 합격, 보상형 채점, 영역 비중 24·30·34·12%. 2026년 안내서 개정(1.0~1.3)은 주로 대상 서비스 목록 변경이라 본문을 읽지 못해, meta 에 "시험 전 최신 안내서 확인"을 적음.
- 방법: 정답·해설·핵심 개념·선지 줄이기 정보를 뺀 파일만 받은 별도 에이전트가 144문항을 모두 다시 풀었다.

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 144 | 144 | 0 | 0 |

- 다시 풀기: 144/144 정답 일치. 지적 없음 (메모: Relocate 예시 VMware Cloud on AWS 는 지금도 AWS 의 예시).
- 출제 현황: basic 58 · intermediate 50 · advanced 36, levelLock 9. 정답 위치 1·2·3·4 = 36·36·36·36.
- 기출 0 / AI 144. 기출 미수록 사유: AWS 시험 문제는 기밀(응시자 비밀유지 서약), 공개 기출 없음.
- 그림 0 (visualNeed none).
- 작성 때 뺀 주제: 최근 바뀐 지원 플랜 등급·프리 티어 세부, Snow 계열, 은퇴·신규 판매 중단 서비스, 정확한 가격·할인율.

## 개념 정리

- 4단원: 1차 3 PASS, security-compliance FAIL(비교표 "Network and firewall settings" 행이 Lambda 에 맞지 않음) → 행을 고친 뒤 새 에이전트 재확인 PASS. 학습 팁 PASS. 기록: concepts-verify/verify-aws-cloud-practitioner.json
