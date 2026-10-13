# 문제 검증: nclex-rn (2026-10-13 새벽 루틴)

- 작성 129 · 통과 128 · 수정 후 통과 1 · 탈락(보관) 1 → 게시 128 (기출 0 / AI 128)
- 기출 미수록 사유: NCLEX 문항은 기밀(응시자 비밀유지 서약). NCSBN 은 문항을 공개하지 않는다
- 방법: answer·explanation·oneLineConcept·choicesByLevel 을 뺀 파일(문제·선지만)을 별도 에이전트 3개(Safe and Effective Care Environment 38 / Health Promotion·Psychosocial·Basic Care 38 / Pharmacological·Reduction of Risk·Physiological Adaptation 50)가 처음부터 다시 풀고, 그다음 줄인 선지 묶음(초급 2·중급 3)에서 정답이 하나뿐인지, 마지막으로 작성자 해설의 사실 오류를 확인
- 결과: 다시 풀기 126/126 일치 + 그림 문제 3/3 일치. 줄인 선지 문제 0
- 수정 후 통과 1: 의식 없는 환자 구강 간호 문항의 정답 선지 문장이 어색함("onto the side with the head turned toward the side") → "Position the client side-lying with the head turned to the side" 로 고침. 같은 묶음의 B형 간염 백신 해설 문장(임신 중 일부 상표만 권고)도 고침 → 별도 에이전트 재검증 2/2 일치
- 탈락(보관) 1: 중심정맥관 공기색전 의심 시 자세(왼쪽 옆·머리 낮춤) — 정답은 일치했으나 근거가 제한적이라는 지적(확신도 중간) → data/review-queue/nclex-rn.json
- 참고(게시): 수술 후 종아리 DVT 의심 문항은 "침상 안정 + 보고"가 최선 답으로 확인(확신도 중간)
- 시험 구성: NCSBN 2026 NCLEX-RN Test Plan(2026-04-01 시행). ncsbn.org·nclex.com 은 실행 환경에서 직접 접속 불가(프록시 403)라 공식 PDF 의 검색 결과 요약으로 확인 (85~150문항, 5시간, 최소 길이 52 + 사례 18 + 사전 문항 15, 8개 영역 비율)

## 그림 (visualNeed medium → physiological-adaptation 단원)

- 그림 문제 3개 (심전도 리듬: 심실세동·무수축·심방세동) + 개념 그림 1개 (정상 동리듬·심방세동·심실세동·무수축 비교), 모두 직접 그림(kind self)
- `npm run images:render -- nclex-rn` 로 PNG 를 만들어 그림을 만든 쪽과 다른 에이전트가 검증

| 그림 | ① | ② | ③ | ④/⑤ |
|---|---|---|---|---|
| ecg-strip-vf.svg | PASS | PASS | PASS | ④ PASS |
| ecg-strip-asystole.svg | PASS | PASS | PASS | ④ PASS |
| ecg-strip-afib.svg | PASS | PASS | PASS | ④ PASS |
| ecg-rhythms-compare.svg | PASS | PASS | PASS | ⑤ PASS (개념 정리 2차 검증에서 단원 글과 대조) |

- 그림 문제 다시 풀기 3/3 일치. 문제 그림·imageAlt 에 리듬 이름을 쓰지 않음(정답 노출 없음)

## 개념 정리

- 10단원 작성 → 1차 분리 검증 PASS 3 / FAIL 7 (요약 문단에 카드·포인트에 없는 사실, Joint Commission 2026 National Performance Goals 명칭, 선별검사 = 2차 예방 표현 과장, 혈당 수치 출처 누락, 근거 없는 표현)
- 고친 뒤 새 검증 에이전트 2차 검증: 10/10 PASS, 개념 그림(ecg-rhythms-compare.svg) ①②③⑤ PASS
- 기록: reports/2026-10/concepts-verify/verify-nclex-rn.json
