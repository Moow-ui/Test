"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { searchCerts } from "@/lib/hangul";
import { fmt, localePath } from "@/lib/i18n";
import type { CertListItem } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** 자격증 이름 검색(초성 지원) + 목록 */
export function CertExplorer({ certs }: { certs: CertListItem[] }) {
  const { locale, m } = useMessages();
  const [query, setQuery] = useState("");
  const results = searchCerts(certs, query);
  const searching = query.trim() !== "";

  return (
    <section aria-labelledby="explorer-title">
      <h2 id="explorer-title" className="text-center text-xl font-extrabold">
        {m.home.findTitle}
      </h2>

      <div className="mx-auto mt-3 max-w-2xl">
        <label htmlFor="cert-search" className="sr-only">
          {m.home.searchLabel}
        </label>
        <input
          id="cert-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={m.home.searchPlaceholder}
          autoComplete="off"
          className="block h-14 w-full rounded-full border-2 border-primary bg-surface px-6 text-center text-lg text-ink shadow-[var(--shadow)] placeholder:text-ink-sub"
        />
      </div>

      <p aria-live="polite" className="mt-4 text-center text-[0.9rem] font-bold text-ink-sub">
        {fmt(searching ? m.home.resultCount : m.home.totalCount, { n: searching ? results.length : certs.length })}
      </p>

      {results.length === 0 ? (
        <p className="card mt-2 p-5">{m.home.noResult}</p>
      ) : (
        <ul className="cv mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.id}>
              <Link
                href={localePath(locale, `/cert/${c.id}`)}
                className="card flex min-h-[4.5rem] items-center justify-between gap-2 p-3 pl-4 hover:border-primary"
              >
                <span>
                  <span className="block text-[1.05rem] font-bold leading-snug">{c.name}</span>
                  <span className="text-[0.85rem] text-ink-sub">
                    {c.grade} · {c.field}
                  </span>
                </span>
                {c.ready ? <Badge tone="ok">{m.common.ready}</Badge> : <Badge>{m.common.comingSoon}</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
