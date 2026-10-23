# 그림 검증: excavator-operator · work-device (굴착기운전기능사 · 작업장치)

- 날짜: 2026-10-24 (새벽 루틴 그림 보강)
- 방법: 그림 문제 6개를 정답·해설을 뺀 파일과 `npm run images:render` PNG 만 받은 별도 에이전트가 다시 풀고, 그림마다 체크리스트를 확인했다.

| 작성 | 통과 | 탈락 |
|---|---|---|
| 6 | 6 | 0 |

- 다시 풀기 6/6 일치.
- excavator-parts-mark.svg (문제 1·2: 붐·암·버킷·카운터웨이트 표시): ① PASS ② PASS ③ PASS ④ PASS
- excavator-cylinders-mark.svg (문제 3~5: 붐·암·버킷 실린더와 하부 주행체 표시): ① PASS ② PASS ③ PASS ④ PASS
- excavator-attachments-mark.svg (문제 6: 버킷·크램셸·리퍼·브레이커): ① PASS ② PASS ③ PASS ④ PASS
- excavator-structure.svg (개념 그림, 작업장치 단원 figures): ① PASS ② PASS ③ PASS ⑤ PASS (참고: '버킷 실린더'라는 이름은 단원 본문에 "붐·암·버킷은 각각 따로 있는 유압 실린더"로만 나온다)
- 모두 직접 그린 그림 (`kind: self`).
