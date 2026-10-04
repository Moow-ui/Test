"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { certKind, fmt, localePath } from "@/lib/i18n";
import { GRADE_FILTER_ORDER } from "@/lib/schemas";
import type { CertListItem } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** 등급 단추에 없는 등급·등급 없는 자격증 */
const OTHER = "other";

interface Filter {
  field: string | null;
  grade: string | null;
  ready: boolean;
}
const NO_FILTER: Filter = { field: null, grade: null, ready: false };

function gradeKey(cert: CertListItem, grades: readonly string[]): string {
  return cert.grade && grades.includes(cert.grade) ? cert.grade : OTHER;
}

/** 주소(쿼리) ↔ 필터. 공유한 주소로 열면 같은 필터가 걸린다: ?field=전기&grade=기사&ready=1 */
function readFilter(): Filter {
  const q = new URLSearchParams(window.location.search);
  return { field: q.get("field"), grade: q.get("grade"), ready: q.get("ready") === "1" };
}
function writeFilter(f: Filter): void {
  const q = new URLSearchParams(window.location.search);
  for (const [key, value] of [
    ["field", f.field],
    ["grade", f.grade],
    ["ready", f.ready ? "1" : null],
  ] as const) {
    if (value) q.set(key, value);
    else q.delete(key);
  }
  const search = q.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
}

/**
 * 홈 맨 아래 "전체 자격증 목록" (P15): 카드 격자 + 제목 오른쪽 [분류] 단추.
 * 카드는 서버 HTML 에 모두 들어 있다 (검색엔진이 모든 자격증 페이지를 찾을 수 있게). 필터는 화면에서 숨기기만 한다.
 * 준비된 자격증이 앞(getCertList 순서), "준비 중"은 회색 카드 + 작은 배지. 개념 정리가 있는 자격증은 "개념" 배지.
 */
export function CertGrid({ certs, conceptIds }: { certs: CertListItem[]; conceptIds: string[] }) {
  const { locale, m: all } = useMessages();
  const m = all.home;
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>(NO_FILTER);

  // 분야: 데이터에 있는 값만, 자격증이 많은 분야부터
  const fieldCount = new Map<string, number>();
  for (const c of certs) fieldCount.set(c.field, (fieldCount.get(c.field) ?? 0) + 1);
  const fields = [...fieldCount.keys()].sort((a, b) => fieldCount.get(b)! - fieldCount.get(a)! || a.localeCompare(b));
  // 등급: 데이터에 있는 것만 + 기타
  const grades = GRADE_FILTER_ORDER.filter((g) => certs.some((c) => c.grade === g));
  const gradeOptions = grades.length > 0 ? [...grades, OTHER] : [];
  const hasNotReady = certs.some((c) => !c.ready);

  // 주소에 필터가 있으면 펼친 채로 시작한다 (첫 그림은 서버와 같게 전체 목록)
  useEffect(() => {
    const f = readFilter();
    if (f.field || f.grade || f.ready) {
      setFilter(f);
      setOpen(true);
    }
  }, []);

  const update = (next: Filter) => {
    setFilter(next);
    writeFilter(next);
  };

  const shown = certs.filter(
    (c) =>
      (!filter.field || c.field === filter.field) &&
      (!filter.grade || gradeKey(c, grades) === filter.grade) &&
      (!filter.ready || c.ready),
  );
  const active = !!(filter.field || filter.grade || filter.ready);

  const chip = (pressed: boolean, label: string, onClick: () => void, key?: string) => (
    <button
      key={key ?? label}
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-lg px-4 text-sm font-bold ${
        pressed ? "bg-primary text-on-primary" : "bg-surface-2 text-ink hover:bg-primary-soft"
      }`}
    >
      {label}
    </button>
  );

  return (
    <nav aria-labelledby="all-certs-title" className="pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="all-certs-title" className="text-lg font-bold">
          {m.allCerts}
          <span className="ml-2 text-sm font-bold text-ink-sub">{fmt(m.certCount, { n: shown.length })}</span>
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`btn min-h-11 px-4 text-sm ${active ? "btn-primary" : ""}`}
        >
          {open ? m.filterClose : active ? m.filterOn : m.filter}
        </button>
      </div>

      <div id={panelId} hidden={!open} className="card mt-4 space-y-4 p-4">
        <fieldset>
          <legend className="text-sm font-bold text-ink-sub">{m.filterField}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {chip(!filter.field, all.common.all, () => update({ ...filter, field: null }), "field-all")}
            {fields.map((f) => chip(filter.field === f, f, () => update({ ...filter, field: f }), `field-${f}`))}
          </div>
        </fieldset>
        {gradeOptions.length > 1 && (
          <fieldset>
            <legend className="text-sm font-bold text-ink-sub">{m.filterGrade}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {chip(!filter.grade, all.common.all, () => update({ ...filter, grade: null }), "grade-all")}
              {gradeOptions.map((g) =>
                chip(filter.grade === g, g === OTHER ? m.filterOther : g, () => update({ ...filter, grade: g }), `grade-${g}`),
              )}
            </div>
          </fieldset>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {hasNotReady ? (
            chip(filter.ready, m.filterReady, () => update({ ...filter, ready: !filter.ready }), "ready")
          ) : (
            <span />
          )}
          {active && (
            <button
              type="button"
              onClick={() => update(NO_FILTER)}
              className="min-h-11 px-2 text-sm font-bold text-ink-sub underline underline-offset-2"
            >
              {m.filterReset}
            </button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="card mt-4 p-4 font-bold">{m.filterNone}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <li key={c.id} hidden={!shown.includes(c)}>
              <Link
                href={localePath(locale, `/cert/${c.id}`)}
                className={`flex min-h-20 h-full flex-col justify-center gap-1 rounded-2xl border px-4 py-2 hover:border-primary ${
                  c.ready
                    ? "border-card-line bg-surface text-ink shadow-card"
                    : "border-card-line bg-surface-2 text-ink-sub"
                }`}
              >
                <span className="font-bold leading-snug">{c.name}</span>
                <span className="flex flex-wrap items-center gap-2 text-sm">
                  <span className={c.ready ? "text-ink-sub" : ""}>{certKind(all, c)}</span>
                  {c.ready && conceptIds.includes(c.id) && (
                    <span className="rounded-full bg-primary-soft px-2 font-bold text-accent">{m.conceptBadge}</span>
                  )}
                  {!c.ready && (
                    <span className="rounded-full bg-surface px-2 font-bold text-ink-sub">{all.common.comingSoon}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
