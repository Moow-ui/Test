import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 회원 정보 저장소 (Cloudflare D1, 서버 전용).
 *
 * D1 은 Cloudflare 가 제공하는 SQLite 데이터베이스다. wrangler.jsonc 의 "DB" 바인딩으로 연결되며,
 * 내 컴퓨터(npm run dev)에서는 .wrangler 폴더 안의 로컬 파일로 대신 동작한다.
 * 표(테이블)는 처음 쓸 때 자동으로 만들어지므로 따로 실행할 명령이 없다.
 */

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export interface D1Like {
  prepare(query: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}

declare global {
  interface CloudflareEnv {
    DB?: D1Like;
  }
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     username TEXT NOT NULL UNIQUE,
     nickname TEXT NOT NULL,
     pw_hash TEXT NOT NULL,
     pw_salt TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS user_data (
     user_id TEXT NOT NULL,
     key TEXT NOT NULL,
     value TEXT NOT NULL,
     updated_at INTEGER NOT NULL,
     PRIMARY KEY (user_id, key)
   )`,
  `CREATE TABLE IF NOT EXISTS login_attempts (
     username TEXT PRIMARY KEY,
     fails INTEGER NOT NULL,
     locked_until INTEGER NOT NULL
   )`,
  // 문제 오류 신고 (누가 보냈는지는 저장하지 않는다). 관리자 화면(/admin)에서 본다
  `CREATE TABLE IF NOT EXISTS reports (
     id TEXT PRIMARY KEY,
     cert_id TEXT NOT NULL,
     question_id TEXT NOT NULL,
     stem TEXT NOT NULL,
     reason TEXT NOT NULL,
     memo TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     resolved_at INTEGER
   )`,
  `CREATE INDEX IF NOT EXISTS reports_created ON reports (created_at)`,
  // 자격증 후기 (이용자가 직접 쓴 글만. 로그인 없이 쓸 수 있다).
  // ip_hash 는 "같은 IP 하루 3개" 제한용으로, IP 원문이 아니라 날짜를 섞은 해시라 다음 날이면 이어지지 않는다.
  // hidden: 0 보임 · 1 관리자가 숨김 · 2 신고 누적으로 자동 숨김
  `CREATE TABLE IF NOT EXISTS reviews (
     id TEXT PRIMARY KEY,
     cert_id TEXT NOT NULL,
     rating INTEGER NOT NULL,
     body TEXT NOT NULL,
     status TEXT NOT NULL,
     nickname TEXT NOT NULL,
     user_id TEXT,
     ip_hash TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     hidden INTEGER NOT NULL DEFAULT 0,
     report_count INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS reviews_cert ON reviews (cert_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS reviews_ip ON reviews (ip_hash, created_at)`,
  // 후기 신고 (같은 사람이 같은 후기를 여러 번 신고해도 1번으로 센다. 해시는 후기마다 달라 서로 이어지지 않는다)
  `CREATE TABLE IF NOT EXISTS review_flags (
     review_id TEXT NOT NULL,
     ip_hash TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (review_id, ip_hash)
   )`,
  // 자격증별 주간 풀이 횟수 (횟수만 센다. 누가 풀었는지는 저장하지 않는다)
  `CREATE TABLE IF NOT EXISTS quiz_activity (
     cert_id TEXT NOT NULL,
     week_start INTEGER NOT NULL,
     count INTEGER NOT NULL,
     PRIMARY KEY (cert_id, week_start)
   )`,
];

/** 나중에 추가한 칸. 이미 있으면 오류가 나므로 하나씩 실행하고 그 오류는 넘어간다 */
const ADDED_COLUMNS = [`ALTER TABLE users ADD COLUMN last_seen_at INTEGER`];

let schemaReady: Promise<void> | null = null;

async function ensureSchema(db: D1Like): Promise<void> {
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  for (const sql of ADDED_COLUMNS) {
    try {
      await db.prepare(sql).run();
    } catch (error) {
      if (!/duplicate column/i.test(String(error))) throw error;
    }
  }
}

/** DB 를 돌려준다. 연결되어 있지 않으면(바인딩 없음) null */
export async function getDb(): Promise<D1Like | null> {
  let db: D1Like | undefined;
  try {
    db = (await getCloudflareContext({ async: true })).env.DB;
  } catch {
    return null;
  }
  if (!db) return null;
  schemaReady ??= ensureSchema(db).catch((error) => {
    schemaReady = null;
    throw error;
  });
  await schemaReady;
  return db;
}
