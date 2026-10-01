import { getCertList } from "@/lib/data";
import { SITE_TAGLINE } from "@/lib/site";

export default async function HomePage() {
  const certs = await getCertList();
  return (
    <div>
      <h1 className="text-2xl font-extrabold">{SITE_TAGLINE}</h1>
      <p className="mt-2">자격증 {certs.length}종 준비 중입니다.</p>
    </div>
  );
}
