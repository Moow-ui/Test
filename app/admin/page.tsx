import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ReportStatusButton } from "@/components/admin/ReportStatusButton";
import { brandName, fmt, getMessages } from "@/lib/i18n";
import { getAdminIdentity } from "@/lib/server/access";
import { MEMBER_LIST_LIMIT, formatKst, getAdminOverview } from "@/lib/server/admin";
import { getDb } from "@/lib/server/db";

// 관리자 한 사람이 보는 화면이라 문구는 한국어만 쓴다
const LOCALE = "ko";

// 요청마다 Access 토큰을 확인하고 DB 를 읽는다 (미리 만들어 두지 않는다)
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const m = getMessages(LOCALE).seo.admin;
  return {
    title: fmt(m.title, { brand: brandName(LOCALE) }),
    description: m.description,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  // Cloudflare Access 를 통과하지 않은 요청에는 이런 화면이 없는 것처럼 404 로 답한다
  const admin = await getAdminIdentity(await headers());
  if (!admin) notFound();

  const all = getMessages(LOCALE);
  const m = all.admin;
  const reasons: Record<string, string> = all.report.reasons;
  const db = await getDb();
  if (!db) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-extrabold">{m.title}</h1>
        <p className="card p-4 font-bold">{m.dbMissing}</p>
      </div>
    );
  }
  const data = await getAdminOverview(db);
  const stats = [
    { label: m.total, value: data.total },
    { label: m.today, value: data.today },
    { label: m.week, value: data.week },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-extrabold">{m.title}</h1>
        <p className="text-[0.9rem] font-bold text-ink-sub">{admin.email}</p>
      </header>

      <section aria-labelledby="members-title" className="space-y-3">
        <h2 id="members-title" className="text-xl font-extrabold">
          {m.members}
        </h2>
        <dl className="grid gap-2 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card p-4">
              <dt className="font-bold text-ink-sub">{s.label}</dt>
              <dd className="text-3xl font-extrabold">{fmt(m.people, { n: s.value })}</dd>
            </div>
          ))}
        </dl>

        <h3 className="font-extrabold">{fmt(m.memberList, { n: MEMBER_LIST_LIMIT })}</h3>
        {data.members.length === 0 ? (
          <p className="card p-4">{m.noMembers}</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-[0.95rem]">
              <thead>
                <tr className="border-b-2 border-line">
                  {[m.username, m.nickname, m.joined, m.lastSeen, m.solved].map((label) => (
                    <th key={label} scope="col" className="whitespace-nowrap px-3 py-2 font-extrabold">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.members.map((u) => (
                  <tr key={u.username} className="border-b border-line-soft">
                    <td className="px-3 py-2 font-bold">{u.username}</td>
                    <td className="px-3 py-2">{u.nickname}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{formatKst(u.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {u.lastSeenAt ? formatKst(u.lastSeenAt) : m.never}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{u.solved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="reports-title" className="space-y-3">
        <h2 id="reports-title" className="text-xl font-extrabold">
          {m.reports}
        </h2>
        <p className="font-bold">{fmt(m.count, { open: data.reportOpen, n: data.reportTotal })}</p>
        {data.reports.length === 0 ? (
          <p className="card p-4">{m.none}</p>
        ) : (
          <ul className="space-y-2">
            {data.reports.map((r) => (
              <li key={r.id} className="card space-y-1 p-3">
                <p className="text-[0.85rem] font-bold text-ink-sub">
                  {formatKst(r.createdAt)} · {r.certId} · {fmt(m.questionId, { id: r.questionId })}
                  {r.resolvedAt && <span className="ml-2 text-ok">{m.resolved}</span>}
                </p>
                <p className="font-bold">{reasons[r.reason] ?? r.reason}</p>
                <p className="text-[0.95rem]">{fmt(m.question, { stem: r.stem })}</p>
                {r.memo && <p className="whitespace-pre-wrap text-[0.95rem]">{fmt(m.memo, { memo: r.memo })}</p>}
                <ReportStatusButton
                  id={r.id}
                  resolved={!!r.resolvedAt}
                  labels={{ done: m.done, undo: m.undo, failed: m.failed }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
