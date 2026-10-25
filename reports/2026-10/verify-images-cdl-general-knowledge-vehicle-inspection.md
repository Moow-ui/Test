# 그림 검증: cdl-general-knowledge · vehicle-inspection

- 날짜: 2026-10-26 (새벽 루틴 그림 보강)
- 근거: NY DMV CDL-10 (11/25) Section 2 (https://dmv.ny.gov/brochure/cdl10sec02.pdf) — 2.1.3 타이어 홈 깊이(앞 4/32인치·나머지 2/32인치), 휠 너트 주변 녹(풀림 의심), 핸들 유격 10도(20인치 핸들에서 약 2인치) 초과, 판스프링 1/4 이상 부러짐·빠짐·주 판 부러짐은 운행 중지; 2.1.5 Step 5 순회 점검 순서, 측면 표시등(뒤 빨강·나머지 호박색).
- 방법: 정답·해설을 뺀 문제와 PNG(`npm run images:render`)만 받은 별도 에이전트가 다시 풀고 그림마다 체크리스트 확인.

| 작성 | 통과 | 수정 후 통과 | 탈락 |
|---|---|---|---|
| 8 | 6 | 2 | 0 |

- 다시 풀기 8/8 일치.
- tread-depth-3-32.svg (2문항): 1차 ① FAIL(눈금 '8'이 테두리에 닿음) → 자 테두리를 늘린 뒤 새 에이전트 재검증 ① PASS ② PASS ③ PASS ④ PASS
- leaf-spring-2-of-8-broken.svg (1문항): 1차 ①④ 약함(이름 없는 받침판이 9번째 판처럼 보임) → 받침판을 지운 뒤 새 에이전트 재검증 ① PASS ② PASS ③ PASS ④ PASS
- wheel-lug-nut-rust-streaks.svg: ① PASS ② PASS ③ PASS ④ PASS
- steering-wheel-3-inch-play.svg: ① PASS ② PASS ③ PASS ④ PASS
- walk-around-top-view.svg: ① PASS ② PASS ③ PASS ④ PASS
- side-marker-lights-a-b.svg (2문항): ① PASS ② PASS ③ PASS ④ PASS
- tire-tread-minimums.svg (개념 그림): ① PASS ② PASS ③ PASS ⑤ PASS
