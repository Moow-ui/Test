/**
 * 데이터 폴더·파일 이름 규칙. (상세: docs/data-rules.md)
 *
 *   data/certs/{country}/{slug}/
 *     meta.json                   자격증 정보 (시행기관, 시험 구성, 선지 수, 합격 기준, 출처)
 *     chapters.json               과목·단원·중요도·출제 비중
 *     concepts.json               개념 정리 (선택. 검증을 통과한 단원만 페이지가 생긴다)
 *     questions/{chapterId}.json  단원별 문제 (파일당 최대 300문항, 넘으면 {chapterId}-2.json, -3.json)
 *     exams/{year}-{round}.json   실전 모의고사 구성
 *     assets/                     문제 그림
 *   data/cert-queue.json          추가할 자격증 대기 목록
 *   data/review-queue/            검수 대기 목록
 *   data/legacy-question-ids.json 새 id 규칙 이전에 만든 문제 id (바꾸지 않는다)
 *
 * 여기에는 경로 문자열만 둔다 (fs 를 쓰지 않으므로 화면 코드에서도 불러올 수 있다).
 * 경로는 모두 data 폴더 기준이고 구분자는 "/" 다.
 */

export const CERTS_DIR = "certs";
export const CERT_QUEUE_FILE = "cert-queue.json";
export const LEGACY_IDS_FILE = "legacy-question-ids.json";

export const countryDir = (country: string) => `${CERTS_DIR}/${country}`;
export const certDir = (country: string, slug: string) => `${CERTS_DIR}/${country}/${slug}`;
export const metaFile = (country: string, slug: string) => `${certDir(country, slug)}/meta.json`;
export const chaptersFile = (country: string, slug: string) => `${certDir(country, slug)}/chapters.json`;
export const questionsDir = (country: string, slug: string) => `${certDir(country, slug)}/questions`;
export const examsDir = (country: string, slug: string) => `${certDir(country, slug)}/exams`;
export const assetsDir = (country: string, slug: string) => `${certDir(country, slug)}/assets`;
export const conceptsFile = (country: string, slug: string) => `${certDir(country, slug)}/concepts.json`;

/** 자격증 폴더 안에 둘 수 있는 이름 */
export const CERT_DIR_ENTRIES = ["meta.json", "chapters.json", "concepts.json", "questions", "exams", "assets"];

/** 단원의 n번째 문제 파일 이름 (확장자 없이). 1번째는 단원 id 그대로, 2번째부터 -2, -3 */
export function questionFileStem(chapterId: string, part: number): string {
  return part <= 1 ? chapterId : `${chapterId}-${part}`;
}

/** 실전 모의고사 파일 이름: {year}-{round}.json */
export const EXAM_FILE_PATTERN = /^\d{4}-\d{1,2}\.json$/;

/**
 * 문제 id 영구 규칙: {slug}-{chapterId}-{4자리 번호}
 * 한번 정한 id 는 바꾸거나 다시 쓰지 않는다 (회원의 오답노트·풀이 기록이 id 를 가리킨다).
 */
export function questionId(slug: string, chapterId: string, n: number): string {
  return `${slug}-${chapterId}-${String(n).padStart(4, "0")}`;
}

/** 새 규칙의 id 인가 (단원 부분은 만들 때의 단원이므로 지금의 chapterId 와 달라도 된다) */
export function isQuestionIdFor(slug: string, id: string): boolean {
  if (!id.startsWith(`${slug}-`)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{4}$/.test(id.slice(slug.length + 1));
}

/** id 끝의 번호 (새 규칙의 id 가 아니면 null) */
export function questionIdNumber(slug: string, chapterId: string, id: string): number | null {
  const prefix = `${slug}-${chapterId}-`;
  if (!id.startsWith(prefix)) return null;
  const rest = id.slice(prefix.length);
  return /^\d{4}$/.test(rest) ? Number(rest) : null;
}

// ───────── 배포되는 정적 파일 (빌드 때 scripts/build-data.ts 가 public/data 에 만든다) ─────────

/** 저장소 기준 폴더. 주소는 /data/… */
export const PUBLIC_DATA_DIR = "public/data";

/** 자격증 slug 전체 목록 ("준비 중" 포함). 후기·활동 API 가 없는 자격증 id 를 걸러 내는 데 쓴다 */
export const PUBLIC_CERT_IDS_PATH = "cert-ids.json";
/** 자격증의 문제 목록 (뽑기에 필요한 값만 담은 가벼운 파일) */
export const publicPoolPath = (slug: string) => `${slug}/pool.json`;
/** 자격증의 문제 전체 (원본 단원 파일을 합친 것. 배포 파일 수를 줄이려고 자격증마다 1개) */
export const publicQuestionsPath = (slug: string) => `${slug}/questions.json`;
/** 홈 "오늘의 1문제" 일정표 (나라별, lib/daily.ts) */
export const publicDailyPath = (country: string) => `daily/${country.toLowerCase()}.json`;
export const publicAssetPath = (slug: string, name: string) => `${slug}/assets/${name}`;
export const publicDataUrl = (relative: string) => `/data/${relative}`;
