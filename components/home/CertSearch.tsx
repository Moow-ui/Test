"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { searchCerts } from "@/lib/hangul";
import { certKind, fmt, localePath } from "@/lib/i18n";
import type { CertListItem } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** 자동완성에 한 번에 보여 줄 자격증 수 */
const MAX_SUGGESTIONS = 8;

/**
 * 홈의 큰 검색창 + 자동완성.
 * 초성("ㅈㄱㄱㄴㅅ")·띄어쓰기 무시("전기 기능사")·줄임말 검색은 lib/hangul.ts 의 searchCerts.
 * 키보드: ↓/↑ 로 고르고 Enter 로 이동, Esc 로 닫기. 결과가 없으면 "아직 없는 자격증이에요".
 */
export function CertSearch({ certs }: { certs: CertListItem[] }) {
  const { locale, m } = useMessages();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(true);
  const listId = useId();

  const typed = query.trim() !== "";
  const results = typed ? searchCerts(certs, query).slice(0, MAX_SUGGESTIONS) : [];
  const showList = typed && open;
  const hrefOf = (c: CertListItem) => localePath(locale, `/cert/${c.id}`);
  const optionId = (i: number) => `${listId}-${i}`;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault();
      router.push(hrefOf(results[Math.max(active, 0)]));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <section aria-label={m.home.searchLabel} className="mx-auto w-full max-w-2xl">
      <label htmlFor="cert-search" className="sr-only">
        {m.home.searchLabel}
      </label>
      <input
        id="cert-search"
        type="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList && results.length > 0}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(-1);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={m.home.searchPlaceholder}
        autoComplete="off"
        enterKeyHint="go"
        className="block h-16 w-full rounded-2xl border-2 border-primary bg-surface px-4 text-base text-ink placeholder:text-ink-sub sm:px-6 sm:text-lg"
      />

      <p aria-live="polite" className="sr-only">
        {typed ? fmt(m.home.resultCount, { n: results.length }) : ""}
      </p>

      {showList &&
        (results.length === 0 ? (
          <p className="mt-2 card px-6 py-4 text-lg font-bold">{m.home.noResult}</p>
        ) : (
          <ul id={listId} role="listbox" aria-label={m.home.searchLabel} className="mt-2 card py-2">
            {results.map((c, i) => (
              <li key={c.id} id={optionId(i)} role="option" aria-selected={i === active}>
                <Link
                  href={hrefOf(c)}
                  tabIndex={-1}
                  className={`flex min-h-14 items-center justify-between gap-4 px-6 py-2 hover:bg-primary-soft ${
                    i === active ? "bg-primary-soft" : ""
                  }`}
                >
                  <span className="font-bold leading-snug">{c.name}</span>
                  <span className="shrink-0 text-sm text-ink-sub">
                    {c.ready ? certKind(m, c) : m.common.comingSoon}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
