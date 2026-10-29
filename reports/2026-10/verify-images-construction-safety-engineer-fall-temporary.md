# 그림 검증: construction-safety-engineer · fall-temporary (추락 방지와 가설 구조물)

- 날짜: 2026-10-30 (새벽 루틴 그림 보강)
- 기준: law.go.kr 산업안전보건기준에 관한 규칙 현행본(시행 2026.3.2, 고용노동부령 제450호) 제13조·제24조·제42조·제63조·제67조·제68조
- 방법: 그림을 만든 에이전트와 다른 에이전트가 `npm run images:render` PNG 와 정답을 뺀 문제만 보고 다시 풀고 체크리스트를 확인했다.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 7 | 7 | 0 |

| 그림 | 체크리스트 |
|---|---|
| fall-guardrail-parts-abcd | ① PASS ② PASS ③ PASS ④ PASS |
| fall-guardrail-height-h | ① PASS ② PASS ③ PASS ④ PASS |
| fall-guardrail-top-150cm | ① PASS ② PASS ③ PASS ④ PASS |
| fall-net-distance-overhang | ① PASS ② PASS ③ PASS ④ PASS |
| fall-net-sag-4m | ① PASS ② PASS ③ PASS ④ PASS |
| fall-ladder-top-angle | ① PASS ② PASS ③ PASS ④ PASS |
| fall-trestle-angle-width | 1차 ③ FAIL (지주부재가 약 76도로 그려져 제67조 75도 이하와 어긋남) → 지주를 벌려 72.3도로 고친 뒤 체크리스트 전체 재확인 ① PASS ② PASS ③ PASS ④ PASS |
| fall-guardrail-overview (개념) | ① PASS ② PASS ③ PASS ⑤ PASS |

- 다시 풀기 7/7 일치.
- 개념 정리 단원: 안전난간 카드(제13조)와 그림을 더하면서 단원 전체를 다시 검증. 1차에서 '와이어로프와 체인의 안전계수' 문장(제55조 2024.6.28 전문개정으로 기준 없어짐)과 확인할 수 없는 출제 빈도 표현이 지적되어 고침, 방호망 3m 는 '바깥쪽으로 설치할 때'로 조건을 보탬 → 새 에이전트 재확인.
