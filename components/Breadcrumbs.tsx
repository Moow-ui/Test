import Link from "next/link";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

/** 현재 위치 표시 + BreadcrumbList 구조화 데이터. label 은 읽어 주는 이름("현재 위치") */
export function Breadcrumbs({ crumbs, label }: { crumbs: Crumb[]; label: string }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <nav aria-label={label} className="no-print mb-3 text-[0.85rem] text-ink-sub">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.path} className="flex items-center gap-1.5">
                {last ? (
                  <span aria-current="page" className="font-bold text-ink">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.path} className="link">
                      {c.name}
                    </Link>
                    <span aria-hidden="true">›</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
