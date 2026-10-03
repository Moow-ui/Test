/**
 * IndexNow 설정 — 키와 제출 주소는 여기 한 곳에만 둔다.
 *
 * IndexNow 는 페이지가 새로 생기거나 바뀌었을 때 검색엔진(Bing·네이버 등)에 바로 알리는 규격이다.
 * 구글은 IndexNow 를 쓰지 않는다.
 *
 * - 키는 공개되는 값이다. 빌드 때 public/{키}.txt 로 내보내져 https://도메인/{키}.txt 에서 열린다
 *   (scripts/build-indexnow-key.ts).
 * - 키를 바꾸면 다음 배포부터 새 키 파일이 올라가고, 정기 작업이 새 키로 제출한다.
 * - 제출은 배포와 별개로 1시간마다 도는 정기 작업이 한다 (custom-worker.ts → lib/server/indexnow.ts).
 */

/** 16진수 32자리 (규격: 8~128자, a-z A-Z 0-9 -) */
export const INDEXNOW_KEY = "4ef903ced71d2c7a06b5048d58471399";

/**
 * 제출 주소. 규격상 한 곳에 내면 참여 검색엔진 전체에 공유되지만,
 * 네이버가 공유분을 받는지 네이버 공식 문서로 확인하지 못해 네이버 전용 주소에도 같이 낸다 (중복 제출은 문제없다).
 */
export const INDEXNOW_ENDPOINTS = [
  { name: "indexnow", url: "https://api.indexnow.org/indexnow" },
  { name: "naver", url: "https://searchadvisor.naver.com/indexnow" },
] as const;

/** 한 번에 낼 수 있는 최대 주소 수 (규격) */
export const INDEXNOW_MAX_URLS = 10_000;

/** 같은 변경분 제출이 이 횟수만큼 실패하면 포기하고 기록만 남긴다 */
export const INDEXNOW_MAX_ATTEMPTS = 3;
