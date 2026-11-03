# Writer report — automobile-maintenance-craftsman (자동차정비기능사), 2026-11-04

## 공식 확인 (Q-net, 직접 접속)
- 종목 정보 jmCd **6281**: https://www.q-net.or.kr/crf005.do?id=crf00503s02&gSite=Q&gId=&jmCd=6281&jmInfoDivCcd=B0&seriesCd=04
  - 필기 과목: 자동차 엔진, 섀시, 전기·전자장치 정비 및 안전관리 (1과목)
  - 검정방법: 필기 객관식 4지 택일형 60문항(60분) / 실기 작업형(4시간 정도, 100점)
  - 합격기준: 필기·실기 100점 만점 60점 이상
  - 수수료: 필기 14,500원, 실기 41,300원
- 출제기준: 큐넷 자료실 출제기준 목록(https://www.q-net.or.kr/cst006.do?id=cst00601&code=1202&gSite=Q&gId=, 58쪽) "자동차정비기능사(2025.1.1~2027.12.31)", cst006Report('6281','287') → /pageLink.do?link=cst/cstReport (Crownix 뷰어, Playwright 로 1~12쪽 텍스트 추출, 사본 scratchpad/pw/cb4.txt)
  - 적용기간 2025.01.01 ~ 2027.12.31, 객관식 60문항, 1시간 → basisYear 2026 사용
  - 필기 주요항목 16개: 1 충전장치 2 시동장치 3 편의장치(자동차규칙·통신네트워크) 4 등화장치(BCM·IPM·관련 법규) 5 엔진 본체(특수공구·산업안전) 6 윤활 7 연료 8 흡·배기(배출가스·증발가스·대기환경보전법) 9 클러치·수동변속기 10 드라이브라인 11 휠·타이어·얼라인먼트 12 유압식 제동 13 엔진점화 14 유압식 현가 15 조향 16 냉각(환경 폐기물처리규정)
- 공식 과목은 1개뿐이라, 사이트용 영역 3개(엔진 23 · 섀시 22 · 전기·전자 15)로 나눔. 문항 수는 주요항목 수(6·6·4)에 비례한 학습용 어림값이며 meta.content.trendSummary 에 그렇게 밝힘 (지게차 선례와 같음). 단원 examWeight 도 추정.
- 법령 수치(검증 단계에서 재확인 필요): 방향지시등 매분 60~120회, 트레드 깊이 1.6mm 이상 (자동차 및 자동차부품의 성능과 기준에 관한 규칙), 제동력 합 50%·축 50%(뒤축 20%)·좌우 차 8% 이하 (자동차관리법 시행규칙 별표 15), 폐유 = 지정폐기물(폐기물관리법).

## 만든 파일
- data/certs/KR/automobile-maintenance-craftsman/meta.json (examInfo·content·sources·studyTips, addedAt=updatedAt=refinedAt=mergedAt=2026-11-04, printable, basisYear 2026)
- chapters.json (3영역 16단원, 모든 단원 pitfalls 3개, 단원 고유 글 444~540자)
- concepts.json (16단원 전부, verifiedAt 없음; charging 단원에 figures 1개)
- assets/: battery-series-12v-60ah.svg, battery-parallel-12v-60ah.svg, circuit-series-2-4ohm-12v.svg (문제 그림), concept-battery-series-parallel.svg (개념 그림)
- scratchpad/auto/questions.json (170문항, 키 "n" 1..170), questions-blind.json (answer·explanation·oneLineConcept·choicesByLevel·tags 제거)
- 생성 스크립트: q_engine.py, q_chassis.py, q_elec.py, gen.py, chapters_src.py, concepts_src.py, tips.py, svg.py

## 문제 수 (단원 × 난이도)
| 단원 | 초급 | 중급 | 고급 | 계 |
|---|---|---|---|---|
| engine-body | 6 | 4 | 2 | 12 |
| lubrication | 5 | 4 | 2 | 11 |
| cooling | 5 | 3 | 2 | 10 |
| fuel-system | 5 | 4 | 2 | 11 |
| intake-exhaust | 5 | 4 | 2 | 11 |
| ignition | 5 | 3 | 2 | 10 |
| clutch-transmission | 5 | 3 | 2 | 10 |
| driveline | 5 | 3 | 2 | 10 |
| wheel-alignment | 4 | 4 | 2 | 10 |
| hydraulic-brake | 5 | 4 | 2 | 11 |
| suspension | 5 | 3 | 2 | 10 |
| steering | 5 | 3 | 2 | 10 |
| charging | 6 | 5 | 2 | 13 |
| starting | 4 | 4 | 2 | 10 |
| convenience | 4 | 4 | 2 | 10 |
| lighting | 4 | 4 | 3 | 11 |
| **계** | **78** | **59** | **33** | **170** |

- 영역별: 엔진 65(≥23), 섀시 61(≥22), 전기·전자 44(≥15)
- levelLock 13문항(모두 중급·고급 "옳지 않은/아닌 것은?"), 나머지 157문항 choicesByLevel 지정. 초급 비잠금 78.
- 정답 위치: 1번 43 · 2번 43 · 3번 42 · 4번 42 (같은 번호 3연속 없음)
- 모두 source "predicted", reviewedAt 없음. 큐넷 기출·타 사이트 문제 미사용.

## 그림 (visualNeed medium → 1단원)
- 단원: charging(충전장치 정비; 배터리 연결·회로 = ② 연결 그림)
- 문제 n=137 직렬(답 24V 60Ah), n=138 병렬(답 12V 120Ah), n=139 직렬 회로 4Ω 전압(답 8V)
- 개념 그림 concept-battery-series-parallel.svg (concepts.charging.figures)
- `npm run images:render` 4장 PNG(reports/images-png/automobile-maintenance-craftsman/) 직접 확인: 1차본의 병렬 배선 교차·라벨 잘림을 고쳐 다시 그림. 배터리는 위 (+)·아래 (−) 단자 상자로 그림.

## 검사
- `npm run questions:add -- …/questions.json --cert automobile-maintenance-craftsman --dry-run` → 오류 0 (dry-run 리포트 파일은 scratchpad 로 옮김)
- `npm run validate` → 통과
- 고유 내용(가상: 문제 있음 + 모든 단원 verifiedAt 가정으로 lib/content-quality 실행, uniq.ts): problems 0, 문장 655, 다른 KR 자격증과 같은 문장 0, 요점↔개념 겹침 0, 짧은 단원 0, 함정 16/16
- check:unique / check:cert 는 문제를 넣은 뒤에만 돌아감(아직 미실행)
