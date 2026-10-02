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
