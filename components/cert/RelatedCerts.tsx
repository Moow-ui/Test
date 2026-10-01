import Link from "next/link";
import { Badge } from "@/components/Badge";
import type { CertListItem } from "@/lib/types";

/** 관련 자격증 내부 링크 ("같이 많이 따는 자격증") */
export function RelatedCerts({
  certName,
  related,
}: {
  certName: string;
  related: CertListItem[];
}) {
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related-title">
      <h2 id="related-title" className="text-xl font-extrabold">
        {certName}와 같이 많이 따는 자격증
      </h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {related.map((c) => (
          <li key={c.id}>
            <Link
              href={`/cert/${c.id}`}
              className="card flex min-h-14 items-center justify-between gap-2 p-3 hover:border-ink"
            >
              <span>
                <span className="font-bold">{c.name}</span>
                <span className="ml-2 text-[0.85rem] text-ink-sub">
                  {c.grade} · {c.field}
                </span>
              </span>
              {c.ready ? <Badge tone="ok">풀기 가능</Badge> : <Badge>준비 중</Badge>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
