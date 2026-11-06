# 클라우드 환경에 추가할 도메인 (누적 메모)

회장이 "추가할 도메인 모두 알려줘"라고 하면 아래 "추가할 도메인" 표를 그대로 알려 준다.
회장이 넣었다고 하면 그 줄을 "넣었음"으로 옮긴다.

**루틴이 기록하는 법** ([docs/daily-routine.md](../docs/daily-routine.md) "막힌 도메인 메모"):
접속할 때 `CONNECT tunnel failed, response 403` 이 나오면(환경 허용 목록에 없음) 아래 표에 한 줄 더한다. 이미 있으면 더하지 않는다.
연결은 되는데 사이트가 끊거나 503·403 을 돌려주면 허용 목록으로 풀리지 않으므로 "넣어도 안 열림"에 적는다.
이 파일 말고 다른 것은 고치지 않는다.

## 추가할 도메인

| 도메인 | 처음 기록 | 어디에 필요 |
|---|---|---|
| apps.provexam.online | 2026-11-06 정리 | 미국 시험 안내 |
| docs.aws.amazon.com | 2026-11-06 정리 | AWS 시험 안내서 |
| fsc.go.kr | 2026-11-06 정리 | 금융위원회 (금융 자격증 법령) |
| ilga.gov | 2026-11-06 정리 | 일리노이 주 법령 |
| www.ilga.gov | 2026-11-06 정리 | 일리노이 주 법령 |
| kca-coffee.org | 2026-11-06 정리 | 커피 자격 (www 는 이미 있음) |
| kcsc.re.kr | 2026-11-06 정리 | 국가건설기준 (토목·건축) |
| kdca.go.kr | 2026-11-06 정리 | 질병관리청 |
| kec.or.kr | 2026-11-06 정리 | 전기설비기술기준 |
| kesco.or.kr | 2026-11-06 정리 | 한국전기안전공사 |
| legislature.mi.gov | 2026-11-06 정리 | 미시간 주 법령 |
| mcee.go.kr | 2026-11-06 정리 | 기후에너지환경부 |
| mfds.go.kr | 2026-11-06 정리 | 식품의약품안전처 |
| ncleg.gov | 2026-11-06 정리 | 노스캐롤라이나 주 법령 |
| ncs.go.kr | 2026-11-06 정리 | 국가직무능력표준 |
| oah.nc.gov | 2026-11-06 정리 | 노스캐롤라이나 주 규정 |
| open.law.go.kr | 2026-11-06 정리 | 국가법령정보 공동활용 |
| pearsonassessments.com | 2026-11-06 정리 | 미국 시험 안내 |
| e-jkd.org | 2026-11-06 정리 | 지난 기록에 허용 필요로 나옴 |

## 넣었음

- www.samilexam.com · samilexam.com (2026-11-06, 재경관리사) — www 는 열림 확인

## 넣어도 안 열림 (사이트 쪽에서 막음 — 허용 목록으로 해결 안 됨)

- license.kacpta.or.kr · kacpta.or.kr (전산회계) — 연결되자마자 사이트가 끊음
- license.kofia.or.kr · kofia.or.kr — 응답 없음
- dataq.or.kr · www.dataq.or.kr — 사이트가 연결을 끊음 (가끔 열림)
- ilsos.gov · www.ilsos.gov — 사이트가 연결을 끊음
- leginfo.legislature.ca.gov — 사이트가 403
