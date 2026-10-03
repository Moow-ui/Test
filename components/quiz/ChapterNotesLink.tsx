"use client";

import Link from "next/link";
import { localePath } from "@/lib/i18n";
import type { Question, Subject } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/**
 * 틀린 문제의 정답·해설 아래에 두는 "이 단원 핵심정리 보기 →" 링크 (그 문제의 단원 페이지로 간다).
 * 문제의 단원이 자격증의 단원 목록에 없으면 아무것도 그리지 않는다.
 */
export function ChapterNotesLink({
  certId,
  subjects,
  question,
  className = "",
}: {
  certId: string;
  subjects: Subject[];
  question: Pick<Question, "subjectId" | "chapterId">;
  className?: string;
}) {
  const { locale, m } = useMessages();
  const chapter = subjects
    .find((s) => s.id === question.subjectId)
    ?.chapters.find((c) => c.id === question.chapterId);
  if (!chapter) return null;
  return (
    <p className={className}>
      <Link href={localePath(locale, `/cert/${certId}/${chapter.id}`)} className="link font-bold">
        {m.common.chapterNotes}
      </Link>
    </p>
  );
}
