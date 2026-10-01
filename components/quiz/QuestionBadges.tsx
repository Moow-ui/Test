"use client";

import { Badge } from "@/components/Badge";
import { sourceLabel } from "@/lib/format";
import type { Question } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** 문제 출처 배지: "20XX년 X회 기출" 또는 "AI 예상문제", 미검수면 "검수 전" */
export function QuestionBadges({ question }: { question: Pick<Question, "source" | "pastInfo" | "reviewStatus"> }) {
  const { m } = useMessages();
  return (
    <>
      <Badge tone={question.source === "past" ? "primary" : "neutral"}>{sourceLabel(question, m)}</Badge>
      {question.reviewStatus === "unverified" && <Badge tone="warn">{m.source.unverified}</Badge>}
    </>
  );
}
