"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { searchCerts } from "@/lib/hangul";
import type { CertListItem } from "@/lib/types";

const ALL = "전체";

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="group" aria-label={`${label} 고르기`} className="flex flex-wrap items-center gap-2">
      <span className="w-10 shrink-0 font-bold">{label}</span>
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={`min-h-11 rounded-full border-2 px-3.5 text-[0.95rem] font-bold ${
              active
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** 자격증 검색(초성 지원) + 등급·분야 필터 + 목록 */
export function CertExplorer({ certs }: { certs: CertListItem[] }) {
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState(ALL);
  const [field, setField] = useState(ALL);

  const grades = [ALL, ...Array.from(new Set(certs.map((c) => c.grade)))];
  const fields = [ALL, ...Array.from(new Set(certs.map((c) => c.field)))];

  const results = searchCerts(certs, query).filter(
    (c) => (grade === ALL || c.grade === grade) && (field === ALL || c.field === field),
  );
  const filtered = query.trim() !== "" || grade !== ALL || field !== ALL;

  return (
    <section aria-labelledby="explorer-title">
      <h2 id="explorer-title" className="text-xl font-extrabold">
        자격증 찾기
      </h2>

      <div className="mt-3">
        <label htmlFor="cert-search" className="font-bold">
          자격증 이름으로 검색
        </label>
        <input
          id="cert-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: 전기기능사, 지게차, ㅈㄱㄱㄴㅅ"
          autoComplete="off"
          className="mt-1 block h-14 w-full rounded-lg border-2 border-line bg-surface px-4 text-lg text-ink placeholder:text-ink-sub"
        />
        <p className="mt-1 text-[0.9rem] text-ink-sub">
          첫 자음만 입력해도 찾을 수 있습니다. (예: ㅈㄱㄱㄴㅅ → 전기기능사)
        </p>
      </div>

      <div className="mt-3 space-y-2">
        <FilterRow label="등급" options={grades} value={grade} onChange={setGrade} />
        <FilterRow label="분야" options={fields} value={field} onChange={setField} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="font-bold">
          {filtered ? `검색 결과 ${results.length}개` : `전체 ${certs.length}개 자격증`}
        </p>
        {filtered && (
          <button
            type="button"
            className="btn min-h-11 px-3 py-1 text-[0.95rem]"
            onClick={() => {
              setQuery("");
              setGrade(ALL);
              setField(ALL);
            }}
          >
            검색 조건 지우기
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="card mt-3 p-5">
          조건에 맞는 자격증이 없습니다. 검색어를 줄이거나 등급·분야를 &lsquo;전체&rsquo;로 바꿔
          보세요.
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((c) => (
            <li key={c.id}>
              <Link
                href={`/cert/${c.id}`}
                className="card flex min-h-[4.5rem] items-center justify-between gap-2 p-3 hover:border-ink"
              >
                <span>
                  <span className="block text-[1.05rem] font-bold leading-snug">{c.name}</span>
                  <span className="text-[0.85rem] text-ink-sub">
                    {c.grade} · {c.field}
                  </span>
                </span>
                {c.ready ? <Badge tone="ok">풀기 가능</Badge> : <Badge>준비 중</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
