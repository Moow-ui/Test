import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportsView } from "@/components/admin/ReportsView";
import { getCertList } from "@/lib/data";
import { getMessages, isLocale } from "@/lib/i18n";
import { noindexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

// 관리용 숨김 경로: 어디에서도 링크하지 않고 검색엔진에도 색인시키지 않는다 (비밀번호는 없음)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return noindexMetadata(lang, getMessages(lang).seo.admin, "/admin/reports", { shared: "/admin/reports" });
}

export default async function AdminReportsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // 신고는 이 기기에 나라 구분 없이 쌓이므로 모든 나라의 자격증 이름을 넘긴다
  const certs = await getCertList();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">{getMessages(lang).admin.title}</h1>
      <ReportsView certNames={Object.fromEntries(certs.map((c) => [c.id, c.name]))} />
    </div>
  );
}
