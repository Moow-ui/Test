# 그림 검증: driver-license-written · signals-signs (신호와 안전표지)

- 날짜: 2026-10-17 (새벽 루틴 그림 보강)
- 방법: 정답을 뺀 문제와 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인. 기준은 도로교통법 시행규칙 별표6 안전표지

| 작성 | 통과(게시) | 탈락(보관) |
|---|---|---|
| 6 | 3 | 3 |

| 그림 | ① | ② | ③ | ④/⑤ | 결과 |
|---|---|---|---|---|---|
| sign-regulatory-stop.svg (일시정지) | PASS | PASS (적색 팔각형·백색 문자) | PASS | ④ PASS | 게시 |
| sign-mandatory-straight.svg (직진) | PASS | PASS (청색 원·백색 화살표) | PASS | ④ PASS | 게시 |
| sign-regulatory-slow.svg (서행) | PASS | PASS (역삼각형·적색 테두리·흑색 문자, 별표6 규제표지 문자색) | PASS | ④ PASS | 게시 |
| sign-caution-traffic-signal.svg (신호기) | PASS | 보류 | PASS | ④ PASS | 보관 |
| sign-caution-crosswalk.svg (횡단보도) | PASS | 보류 | PASS | ④ PASS | 보관 |
| sign-caution-right-merge.svg (우합류도로) | PASS | 보류 | PASS | ④ PASS | 보관 |
| sign-groups-shape-color.svg (개념 그림) | PASS | PASS | PASS | ⑤ PASS | 게시 |

- 다시 풀기 6/6 정답 일치. 보관 3개는 픽토그램 도안을 별표6 원본 그림과 직접 대조하지 못해(검증 환경에서 원본 이미지 접속 불가) ② 를 확정하지 못함 → `data/review-queue/driver-license-written.json` 에 보관(그림 파일은 assets 에 넣지 않음). 원본 대조 뒤 다시 검증해 게시.
- 출처: 도로교통법 시행규칙 별표6 안전표지를 다시 그림 (법령, 저작권법 제7조 보호받지 못하는 저작물).
