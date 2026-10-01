import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StaticQuestion } from "@/components/StaticQuestion";
import { getCertification, getQuestions, getReadyCertifications } from "@/lib/data";
import { pickCertRepresentatives } from "@/lib/representative";
import { certMainMeta, certOgImagePath, certPastMeta, toMetadata } from "@/lib/seo";
import type { Certification, Question } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

// 문제가 준비된 자격증만 기출 페이지를 만든다
export const dynamicParams = false;

export async function generateStaticParams() {
  const certs = await getReadyCertifications();
  return certs.map((c) => ({ slug: c.id }));
}

/** 기출이 있으면 기출만, 없으면 예상문제에서 대표 문제를 고른다 */
function selectShown(cert: Certification, questions: Question[]) {
  const past = questions.filter((q) => q.source === "past");
  const hasPast = past.length > 0;
  const shown = pickCertRepresentatives(cert.subjects, hasPast ? past : questions);
  return { past, hasPast, shown };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert) return {};
  const { hasPast, shown } = selectShown(cert, await getQuestions(cert.id));
  return toMetadata(certPastMeta(cert, hasPast, shown.length), {
    ogImagePath: certOgImagePath(cert.id),
  });
}

export default async function PastPage({ params }: Props) {
  const { slug } = await params;
  const cert = await getCertification(slug);
  if (!cert?.ready || !cert.examInfo) notFound();

  const questions = await getQuestions(cert.id);
  const { past, hasPast, shown } = selectShown(cert, questions);
  const meta = certPastMeta(cert, hasPast, shown.length);
  const mainMeta = certMainMeta(cert);
  const predictedCount = questions.length - past.length;
  const shortName = cert.shortNames[0] ?? cert.name;

  const chapterOf = (q: Question) => {
    const subject = cert.subjects.find((s) => s.id === q.subjectId);
    const chapter = subject?.chapters.find((c) => c.id === q.chapterId);
    return { subject, chapter };
  };

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        crumbs={[
          { name: "홈", path: "/" },
          { name: cert.name, path: mainMeta.path },
          { name: hasPast ? "기출문제" : "기출 유형 문제", path: meta.path },
        ]}
      />

      <header className="space-y-3">
        <h1 className="text-2xl font-extrabold leading-snug sm:text-3xl">{meta.h1}</h1>
        {hasPast ? (
          <p>
            {cert.name} 필기 기출문제 가운데 자주 나오는 문제 {shown.length}개를 골라 정답과 해설을
            정리했습니다. {cert.spacedName} 시험은 {cert.subjects.map((s) => s.name).join(", ")}{" "}
            과목에서 총 {cert.examInfo.totalQuestions}문항이 나오며, 큐패스에는 권리가 확인된 기출문제{" "}
            {past.length}개가 등록되어 있습니다.
          </p>
        ) : (
          <>
            <p>
              {cert.name} 기출문제의 저작권은 한국산업인력공단에 있어서, 큐패스는 권리가 확인된
              기출문제만 싣습니다. 지금은 최근 출제 유형을 분석해 직접 만든 AI 예상문제{" "}
              {predictedCount}개를 제공하고 있고, 그중 시험에 자주 나오는 유형 {shown.length}개를 아래에
              정답·해설과 함께 정리했습니다.
            </p>
            <p>
              {cert.spacedName} 필기는 {cert.subjects.map((s) => `${s.name} ${s.questionCount}문항`).join(", ")}
              으로 총 {cert.examInfo.totalQuestions}문항입니다. &lsquo;{shortName}&rsquo; 공부를 막
              시작했다면 아래 문제를 먼저 읽어 보고 어떤 유형이 나오는지 감을 잡아 보세요.
            </p>
          </>
        )}
        <p className="rounded-lg border border-warn bg-warn-soft p-3 text-[0.95rem]">
          &lsquo;검수 전&rsquo; 표시가 있는 문제는 전문가 검수를 아직 거치지 않았습니다. 이상한 점이
          보이면 문제 풀이 화면의 &lsquo;문제 오류 신고&rsquo;로 알려 주세요.
        </p>
      </header>

      <section aria-labelledby="questions-title" className="space-y-3">
        <h2 id="questions-title" className="text-xl font-extrabold">
          {cert.name} {hasPast ? "기출문제" : "기출 유형 대표 문제"} {shown.length}선
        </h2>
        {shown.map((q, i) => {
          const { subject, chapter } = chapterOf(q);
          return (
            <StaticQuestion
              key={q.id}
              question={q}
              number={i + 1}
              location={`${subject?.name ?? ""} › ${chapter?.name ?? ""}`}
              chapterImportance={chapter?.importance ?? 3}
            />
          );
        })}
      </section>

      <section aria-labelledby="more-title" className="rounded-xl border-2 border-primary bg-primary-soft p-4">
        <h2 id="more-title" className="text-lg font-extrabold">
          나머지 {questions.length - shown.length}문제는 직접 풀어 보세요
        </h2>
        <p className="mt-1 text-[0.95rem]">
          한 문제씩 풀면 바로 채점되고 해설이 나옵니다. 로그인 없이 무료입니다.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/cert/${cert.id}/quiz?level=intermediate&count=10&subject=all`}
            className="btn btn-primary btn-lg"
          >
            10문제 더 풀기 →
          </Link>
          <Link href={mainMeta.path} className="btn btn-lg">
            {cert.name} 출제 분석 보기
          </Link>
        </div>
      </section>

      <section aria-labelledby="chapters-title">
        <h2 id="chapters-title" className="text-xl font-extrabold">
          단원별 핵심정리
        </h2>
        <div className="mt-2 space-y-3">
          {cert.subjects.map((s) => (
            <div key={s.id}>
              <h3 className="font-bold">{s.name}</h3>
              <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {s.chapters.map((c) => (
                  <li key={c.id}>
                    <Link href={`/cert/${cert.id}/${c.id}`} className="link">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <AdSlot position="past-bottom" />
    </article>
  );
}
