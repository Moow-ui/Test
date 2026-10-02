import Link from "next/link";
import { Badge } from "@/components/Badge";
import { certKind, fmt, getMessages, localePath, type Locale } from "@/lib/i18n";
import type { CertListItem } from "@/lib/types";

/** 관련 자격증 내부 링크 */
export function RelatedCerts({
  locale,
  certName,
  related,
}: {
  locale: Locale;
  certName: string;
  related: CertListItem[];
}) {
  const m = getMessages(locale);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-title" className="cv">
      <h2 id="related-title" className="text-xl font-extrabold">
        {fmt(m.cert.related, { name: certName })}
      </h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {related.map((c) => (
          <li key={c.id}>
            <Link
              href={localePath(locale, `/cert/${c.id}`)}
              className="card flex min-h-14 items-center justify-between gap-2 p-3 hover:border-ink"
            >
              <span>
                <span className="font-bold">{c.name}</span>
                <span className="ml-2 text-[0.85rem] text-ink-sub">
                  {certKind(m, c)} · {c.field}
                </span>
              </span>
              {c.ready ? <Badge tone="ok">{m.common.ready}</Badge> : <Badge>{m.common.comingSoon}</Badge>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
