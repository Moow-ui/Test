import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";
import { getCertList } from "@/lib/data";
import { noindexMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = noindexMetadata(
  `내 정보 | ${SITE_NAME}`,
  "로그인하면 점수 기록, 내가 푼 문제, 오답, 보유 자격증을 한곳에서 볼 수 있습니다.",
);

export default async function ProfilePage() {
  const certs = await getCertList();
  return (
    <ProfileView certs={certs.map((c) => ({ id: c.id, name: c.name, grade: c.grade, ready: c.ready }))} />
  );
}
