import { brandName, fmt, getMessages, type Locale } from "@/lib/i18n";
import type { CertSummary } from "@/lib/types";

/**
 * 자격증 페이지 맨 아래의 시행기관 고지.
 * "이 사이트는 {시행기관}과 관계가 없다"(not affiliated with)는 문장과 공식 사이트 링크, 상표 고지를 보여 준다.
 * 기관 이름·주소·상표 문장은 모두 그 자격증의 meta.json(issuer, trademarkNotice)에서 온다.
 */
export function IssuerNotice({
  locale,
  cert,
}: {
  locale: Locale;
  cert: Pick<CertSummary, "issuer" | "trademarkNotice">;
}) {
  const m = getMessages(locale);
  const { issuer, trademarkNotice } = cert;
  return (
    <aside className="cv space-y-2 border-t border-line-soft pt-4 text-sm text-ink-sub">
      <p>{fmt(m.cert.issuerNotice, { brand: brandName(locale), issuer: issuer.name })}</p>
      {trademarkNotice && <p>{trademarkNotice}</p>}
      {issuer.url && (
        <p>
          {m.cert.organizer}: {issuer.name} ·{" "}
          <a href={issuer.url} target="_blank" rel="noopener noreferrer" className="link">
            {m.cert.officialSite}
          </a>
        </p>
      )}
    </aside>
  );
}
