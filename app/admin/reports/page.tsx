import type { Metadata } from "next";
import { ReportsView } from "@/components/admin/ReportsView";
import { getCertList } from "@/lib/data";
import { noindexMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

// 관리용 숨김 경로: 어디에서도 링크하지 않고 검색엔진에도 색인시키지 않는다 (비밀번호는 없음)
export const metadata: Metadata = noindexMetadata(
  `문제 오류 신고 목록 | ${SITE_NAME}`,
  "관리용 페이지입니다.",
);

export default async function AdminReportsPage() {
  const certs = await getCertList();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">문제 오류 신고 목록 (관리용)</h1>
      <ReportsView certNames={Object.fromEntries(certs.map((c) => [c.id, c.name]))} />
    </div>
  );
}
