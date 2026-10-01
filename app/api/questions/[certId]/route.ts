import { getQuestions, getReadyCertifications } from "@/lib/data";

/**
 * 프로필 화면(내가 푼 문제·오답·핵심 개념)에서 문제 내용을 보여 주기 위한 자격증별 문제 목록.
 * 빌드 때 미리 만들어 두는 정적 파일이다 (실행 중에는 /data 를 읽을 수 없다).
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const certs = await getReadyCertifications();
  return certs.map((c) => ({ certId: c.id }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ certId: string }> }) {
  const { certId } = await params;
  const questions = await getQuestions(certId);
  return Response.json(
    questions.map((q) => ({
      id: q.id,
      subjectId: q.subjectId,
      chapterId: q.chapterId,
      stem: q.stem,
      choices: q.choices,
      answer: q.answer,
      oneLineConcept: q.oneLineConcept,
      source: q.source,
      pastInfo: q.pastInfo ?? null,
    })),
  );
}
