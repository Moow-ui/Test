"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/i18n";
import type { GuideCategory } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";
import { CategoryTile } from "./CategoryIcon";

export interface GuideListItem {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  publishedAt: string;
  minutes: number;
  certName?: string;
  /** 일정이 지난 글 */
  expired?: boolean;
}

/** 주소 끝의 #c=분류 (글 머리의 분류 이름을 누르면 그 분류만 보이게 열린다) */
const HASH = "#c=";

/**
 * 수험 정보 목록 (블로그 글 목록 모양): 위에 분류 탭, 아래에 글 줄.
 * 글 줄 = 분류 · 제목 · 요약 두 줄 · 날짜·읽는 시간·관련 자격증, 오른쪽에 분류 그림 네모. 줄 전체를 누를 수 있다.
 */
export function GuideList({
  items,
  listPath,
  categories,
}: {
  items: GuideListItem[];
  listPath: string;
  categories: GuideCategory[];
}) {
  const { m } = useMessages();
  const t = m.guide;
  const [selected, setSelected] = useState<GuideCategory | "all">("all");

  useEffect(() => {
    const fromHash = window.location.hash.startsWith(HASH) ? window.location.hash.slice(HASH.length) : "";
    if ((categories as string[]).includes(fromHash)) setSelected(fromHash as GuideCategory);
  }, [categories]);

  function choose(next: GuideCategory | "all") {
    setSelected(next);
    window.history.replaceState(null, "", next === "all" ? listPath : `${listPath}${HASH}${next}`);
  }

  // 글이 있는 분류만 탭으로 보여 준다
  const counts = new Map<GuideCategory, number>();
  for (const g of items) counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
  const tabs = categories.filter((c) => counts.has(c));
  const shown = selected === "all" ? items : items.filter((g) => g.category === selected);

  const tab = (key: GuideCategory | "all", label: string, n: number) => (
    <button
      key={key}
      type="button"
      aria-pressed={selected === key}
      onClick={() => choose(key)}
      className={`min-h-11 shrink-0 rounded-full border px-4 font-bold ${
        selected === key ? "border-ink bg-ink text-surface" : "border-line bg-surface text-ink hover:border-ink-sub"
      }`}
    >
      {label} <span className="tabular-nums">{n}</span>
    </button>
  );

  return (
    <div className="space-y-2">
      {tabs.length > 1 && (
        <div role="group" aria-label={t.filterLabel} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {tab("all", t.all, items.length)}
          {tabs.map((c) => tab(c, t.categories[c], counts.get(c) ?? 0))}
        </div>
      )}
      <div className="card overflow-hidden">
        <p className="border-b border-line px-5 py-3 text-sm font-bold text-ink-sub">
          {fmt(t.count, { n: shown.length })}
        </p>
        <ul className="divide-y divide-line">
          {shown.map((g) => (
            <li key={g.slug}>
              <Link
                href={`${listPath}/${g.slug}`}
                className="group flex items-start gap-4 px-5 py-5 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    <span className="text-accent">{t.categories[g.category]}</span>
                    {g.expired && (
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-ink-sub">{t.expiredBadge}</span>
                    )}
                  </p>
                  <h2 className="line-clamp-2 text-lg font-bold leading-snug group-hover:underline">{g.title}</h2>
                  <p className="line-clamp-2 text-ink-sub">{g.description}</p>
                  <p className="text-sm tabular-nums text-ink-sub">
                    {g.publishedAt} · {fmt(t.readTime, { n: g.minutes })}
                    {g.certName && <> · {g.certName}</>}
                  </p>
                </div>
                <CategoryTile category={g.category} className="mt-1 size-20 sm:size-24" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
