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

## 넣었음

- apps.provexam.online · docs.aws.amazon.com · fsc.go.kr · ilga.gov · www.ilga.gov · kca-coffee.org · kcsc.re.kr · kdca.go.kr · kec.or.kr · kesco.or.kr · legislature.mi.gov · mcee.go.kr · mfds.go.kr · ncleg.gov · ncs.go.kr · oah.nc.gov · open.law.go.kr · pearsonassessments.com · e-jkd.org (2026-11-06)
- kacta.or.kr · www.kacta.or.kr (2026-11-06) — www 는 열림 확인
- www.samilexam.com · samilexam.com (2026-11-06, 재경관리사) — www 는 열림 확인

## 넣어도 안 열림 (사이트 쪽에서 막음 — 허용 목록으로 해결 안 됨)

- license.kacta.or.kr — 넣었지만 사이트가 연결을 끊음 (2026-11-06). 전산회계는 회장 확인 자료(reports/official-info/kacta-2026-11-06.md)로 진행
- www.pqi.or.kr · pqi.or.kr — 넣었지만 사이트가 연결을 끊음 (2026-11-06)

- license.kacpta.or.kr · kacpta.or.kr — 열리지 않음. 시행기관 공식 안내에 적힌 주소는 license.kacta.or.kr
- license.kofia.or.kr · kofia.or.kr — 응답 없음
- dataq.or.kr · www.dataq.or.kr — 사이트가 연결을 끊음 (가끔 열림)
- ilsos.gov · www.ilsos.gov — 사이트가 연결을 끊음
- leginfo.legislature.ca.gov — 사이트가 403
