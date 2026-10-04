"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { searchCerts } from "@/lib/hangul";
import { certKind, fmt, localePath } from "@/lib/i18n";
import type { CertListItem } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** 목록에 있는 값만 고를 수 있게, 자격증이 많은 값부터 늘어놓는다 */
function optionsOf(values: Array<string | undefined>): string[] {
  const count = new Map<string, number>();
  for (const v of values) if (v) count.set(v, (count.get(v) ?? 0) + 1);
  return [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)!);
}

const selectClass = "h-12 w-full rounded-lg border-2 border-line bg-surface px-2 text-ink";

/** 자격증 이름 검색(초성 지원) + 분야·등급·자격 종류로 찾기 + 목록 */
export function CertExplorer({ certs }: { certs: CertListItem[] }) {
  const { locale, m } = useMessages();
  const [query, setQuery] = useState("");
  const [field, setField] = useState("");
  const [grade, setGrade] = useState("");
  const [certType, setCertType] = useState("");

  // 고를 수 있는 값은 자격증 데이터에서 나온다 (자격증을 추가하면 저절로 늘어난다)
  const filters: Array<{
    id: string;
    label: string;
    value: string;
    set: (value: string) => void;
    options: string[];
    /** 화면에 보여 줄 이름 (없으면 값 그대로) */
    text?: (value: string) => string;
  }> = [
    { id: "field", label: m.home.filterField, value: field, set: setField, options: optionsOf(certs.map((c) => c.field)) },
    { id: "grade", label: m.home.filterGrade, value: grade, set: setGrade, options: optionsOf(certs.map((c) => c.grade)) },
    {
      id: "type",
      label: m.home.filterType,
      value: certType,
      set: setCertType,
      options: optionsOf(certs.map((c) => c.certType)),
      text: (v: string) => m.certTypes[v as CertListItem["certType"]],
    },
    // 고를 것이 하나뿐이면 보여 주지 않는다
  ].filter((f) => f.options.length > 1);

  const filtered = certs.filter(
    (c) => (!field || c.field === field) && (!grade || c.grade === grade) && (!certType || c.certType === certType),
  );
  const results = searchCerts(filtered, query);
  const narrowed = query.trim() !== "" || filtered.length !== certs.length;

  return (
    <section aria-labelledby="explorer-title">
      <h2 id="explorer-title" className="text-center text-xl font-bold">
        {m.home.findTitle}
      </h2>

      <div className="mx-auto mt-4 max-w-2xl">
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
          className="block h-14 w-full rounded-full border-2 border-primary bg-surface px-6 text-center text-lg text-ink  placeholder:text-ink-sub"
        />

        {filters.length > 0 && (
          <fieldset className="mt-4">
            <legend className="sr-only">{m.home.filterLabel}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-flow-col sm:auto-cols-fr">
              {filters.map((f) => (
                <label key={f.id} className="block text-sm font-bold text-ink-sub">
                  {f.label}
                  <select value={f.value} onChange={(e) => f.set(e.target.value)} className={`mt-2 ${selectClass}`}>
                    <option value="">{m.common.all}</option>
                    {f.options.map((v) => (
                      <option key={v} value={v}>
                        {f.text ? f.text(v) : v}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <p aria-live="polite" className="mt-4 text-center text-sm font-bold text-ink-sub">
        {fmt(narrowed ? m.home.resultCount : m.home.totalCount, { n: results.length })}
      </p>

      {results.length === 0 ? (
        <p className="card mt-2 p-6">{m.home.noResult}</p>
      ) : (
        <ul className="cv mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.id}>
              <Link
                href={localePath(locale, `/cert/${c.id}`)}
                className="card flex min-h-[4.5rem] items-center justify-between gap-2 p-4  hover:bg-primary-soft"
              >
                <span>
                  <span className="block text-base font-bold leading-snug">{c.name}</span>
                  <span className="text-sm text-ink-sub">
                    {certKind(m, c)} · {c.field}
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
