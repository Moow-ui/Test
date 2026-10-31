# 문제 검증: epa-608 (EPA Section 608 Technician Certification)

- 날짜: 2026-11-01 (매일 루틴, 새벽)
- 시험 구성 근거: 40 CFR 82.161(c)·Subpart F Appendix D (eCFR, 2026-10-29 판) — Core·Type I·Type II·Type III 각 25문항 이상, Universal = 4부분 100문항. 합격 70%(부분마다 18/25), 우편 Type I 은 84%. Type II·III·Universal 은 감독관 있는 closed-book. 시간 제한은 규정에 없어 연습 설정 120분으로 표시. 인증은 만료되지 않음(epa.gov Section 608 Technician Certification).
- 법령: eCFR 로 40 CFR 82.152~82.157(누설 기준 10·20·30%, 50 lb 이상 CFC·HCFC, 수리 30일·산업 공정 120일, 확인 시험 10일, 기록 3년)·82.156 진공 기준 표·소형 기기 90/80%·4 inHg, 40 CFR 84.106(2026-01-01부터 15 lb 이상·GWP 53 초과 HFC 등, 주거·경상업 에어컨 제외), 40 CFR 19.4(위반 1일 1건 $124,426) 원문 확인. 시행일이 아직 오지 않은 2028·2029 규정은 문제로 내지 않음.
- 방법: 정답·해설·핵심 개념·choicesByLevel 을 뺀 파일만 받은 별도 에이전트가 173문항을 모두 다시 풀고 eCFR 로 수치를 대조했다. 그림 문제는 `npm run images:render` 로 만든 PNG 를 보고 풀었다.

| 작성 | 통과 | 수정 후 통과 | 탈락(보관) |
|---|---|---|---|
| 173 | 172 | 0 | 1 |

- 다시 풀기: 173/173 정답 일치.
- 탈락 1: 저압 기기용 회수 장치의 고압 차단값(10 psig) — 규정 원문 근거가 없고 학습서 관행 수치뿐이라 `data/review-queue/epa-608.json` 에 보관.
- 메모 1(수정 안 함): 84.106 적용 대상 선지 문구가 "HFC with GWP above 53"으로 요약돼 있으나 정답은 하나로 분명.
- 출제 현황: basic 51 · intermediate 71 · advanced 41 · levelLock(advanced, EXCEPT형) 9. 정답 위치 1·2·3·4 = 44·43·42·43.
- 기출 0 / AI 172. 기출 미수록 사유: EPA 승인 인증기관의 문제은행 비공개(공개 기출 없음).

## 그림 (visualNeed medium, 단원 refrigeration-cycle)

| 그림 | 문항 | 체크리스트 |
|---|---|---|
| refrigeration-cycle-points.svg | 고압 액체 지점 | ① PASS ② PASS ③ PASS ④ PASS |
| refrigeration-cycle-parts.svg | 응축기 찾기 | ① PASS ② PASS ③ PASS ④ PASS |
| manifold-gauge-hoses.svg | 가운데(노란) 호스 | ① PASS ② PASS ③ PASS ④ PASS |

## 개념 정리

- 12단원: 1차 11 PASS, ozone-refrigerants FAIL(배출 금지 근거를 GWP 로 쓴 문장, '오존에 안전한 냉매도 배출 금지'를 예외 없이 쓴 문장) → 40 CFR 82.154(a) 기준으로 두 문장 수정 → 새 에이전트 재검증에서 출처 연도 1건(EPA Test Topics 2026 → 2025, 페이지 갱신일 2025-12-05) 지적 → Test Topics 출처 연도를 2025 로 고쳐 PASS. 개념 그림 refrigeration-cycle-overview.svg ① PASS ② PASS ③ PASS ⑤ PASS. (concepts-verify/verify-epa-608.json)
