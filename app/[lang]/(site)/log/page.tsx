import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAddedLog } from "@/lib/data";
import { LOCALES, getMessages, isLocale, localeCountry, localePath } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.addedLog, "/log", { shared: "/log" });
}

/** 자격증 추가 기록 (사이트 하단 "기록"). 날짜는 meta.json 의 addedAt */
export default async function AddedLogPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = getMessages(lang).addedLog;
  const log = await getAddedLog(localeCountry(lang));
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-xl font-bold">{m.title}</h1>
      <p className="text-ink-sub">{m.intro}</p>
      {log.length === 0 && <p>{m.empty}</p>}
      <ul className="divide-y divide-line-soft border-y border-line-soft">
        {log.map((entry) => (
          <li key={entry.date} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
            <span className="shrink-0 font-bold tabular-nums">{entry.date}</span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              {entry.certs.map((c) => (
                <Link key={c.id} href={localePath(lang, `/cert/${c.id}`)} className="link">
                  {c.name}
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
