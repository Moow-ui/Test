/**
 * 데이터 저장 방식과 읽기 함수를 나누는 경계.
 *
 * lib/data/index.ts 의 읽기 함수는 이 인터페이스만 쓴다.
 * 지금은 /data 폴더의 파일(lib/data/fs-store.ts)이지만, 나중에 D1·R2 로 옮길 때는
 * 같은 모양의 저장소를 하나 더 만들어 index.ts 의 `store` 한 줄만 바꾸면 된다.
 * 경로는 data 폴더 기준이고 구분자는 "/" (lib/data/paths.ts).
 */
export interface DataStore {
  /** 폴더 안의 이름 목록 (이름순). 폴더가 없으면 빈 배열 */
  list(dir: string): Promise<string[]>;
  /** JSON 파일 내용. 파일이 없으면 null */
  readJson(file: string): Promise<unknown | null>;
}
