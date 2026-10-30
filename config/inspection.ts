/**
 * "검사 완료" 날짜 — 자격증 메인 · 개념 정리 목차 · 단원 핵심정리 제목 아래에 "26년 10월 17일 검사 완료"로 나온다.
 *
 * 회장은 하루에 자격증 10개를 검사한다 (2026-10-30 결정. 자격증이 100개 이상 20 · 150개 이상 30 · 200개 이상 40개, lib/inspection.ts). 날짜는 자격증마다 다르고, 기록은 data/inspection.json 이다.
 * 새벽 루틴이 `npm run inspection:next` 로 어제 알려 준 목록을 검사한 날로 적고, 오늘 검사할 목록을 알려 준다 (lib/inspection.ts).
 * 회장이 "그날 검사 못 했다"고 알려 주면 그날을 SKIPPED_DATES 에 적는다 → 그날 목록은 날짜가 바뀌지 않고 다음 날 다시 차례가 온다.
 */

/** 표시하는 언어. 회장이 검사하는 쪽만 적는다 (한국·미국 모두 검사한다, 2026-10-17 확인) */
export const INSPECTED_LOCALES: readonly ("ko" | "en")[] = ["ko", "en"];

/** 검사하지 못한 날 (YYYY-MM-DD, 한국시간) */
export const SKIPPED_DATES: readonly string[] = [];
