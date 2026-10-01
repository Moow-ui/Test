import { getSessionUser, isSameOrigin, json } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { SYNC_FIELDS, type SyncData } from "@/lib/sync-merge";

/** 한 항목이 이 크기를 넘으면 저장하지 않는다 (악용 방지) */
const MAX_VALUE_LENGTH = 400_000;

async function requireUser() {
  const db = await getDb();
  if (!db) return { error: json({ error: "db_missing" }, 503) } as const;
  const user = await getSessionUser(db);
  if (!user) return { error: json({ error: "login_required" }, 401) } as const;
  return { db, user } as const;
}

/** 내 기록 불러오기 (풀이 기록·점수 기록·오답노트·보유 자격증) */
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const rows = await auth.db
    .prepare("SELECT key, value FROM user_data WHERE user_id = ?")
    .bind(auth.user.id)
    .all<{ key: string; value: string }>();

  const data: Partial<Record<keyof SyncData, unknown>> = {};
  for (const row of rows.results) {
    if (!(SYNC_FIELDS as readonly string[]).includes(row.key)) continue;
    try {
      data[row.key as keyof SyncData] = JSON.parse(row.value);
    } catch {
      // 깨진 값은 건너뛴다
    }
  }
  return json({ data });
}

/** 내 기록 저장하기 */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return json({ error: "bad_request" }, 403);
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { data?: Record<string, unknown> } | null;
  if (!body?.data || typeof body.data !== "object") return json({ error: "bad_request" }, 400);

  const now = Date.now();
  const statements = [];
  for (const key of SYNC_FIELDS) {
    const value = body.data[key];
    if (value === undefined || value === null || typeof value !== "object") continue;
    const text = JSON.stringify(value);
    if (text.length > MAX_VALUE_LENGTH) return json({ error: "too_large" }, 413);
    statements.push(
      auth.db
        .prepare(
          `INSERT INTO user_data (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        )
        .bind(auth.user.id, key, text, now),
    );
  }
  if (statements.length > 0) await auth.db.batch(statements);
  return json({ ok: true });
}
