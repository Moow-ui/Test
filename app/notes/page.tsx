import type { Metadata } from "next";
import { NotesIndex } from "@/components/notes/NotesIndex";
import { getReadyCertifications } from "@/lib/data";
import { noindexMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = noindexMetadata(
  `오답노트 | ${SITE_NAME}`,
  "틀린 문제를 모아 다시 풀고 인쇄할 수 있는 오답노트입니다.",
);

export default async function NotesPage() {
  const certs = await getReadyCertifications();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">오답노트</h1>
      <p className="text-ink-sub">
        틀린 문제를 자격증별로 모아 둔 곳입니다. 로그인 없이 이 기기(브라우저)에 저장됩니다.
      </p>
      <NotesIndex certs={certs.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
