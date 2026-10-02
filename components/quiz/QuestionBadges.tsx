"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/Badge";
import { sourceLabel } from "@/lib/format";
import type { Question } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** AI 검증을 통과한 예상문제인가 ("검수 완료"로 표시). 기출은 출처 표기만 한다 */
export function isReviewed(question: Pick<Question, "source" | "reviewStatus">): boolean {
  return question.source === "predicted" && question.reviewStatus === "verified";
}

/**
 * 문제 출처 배지: "20XX년 X회 기출" 또는 "AI 예상문제".
 * 검증을 통과한 예상문제는 "검수 완료" + (i) 검수 방식 안내, 검증 기록이 없으면 "검수 전".
 */
export function QuestionBadges({ question }: { question: Pick<Question, "source" | "pastInfo" | "reviewStatus"> }) {
  const { m } = useMessages();
  const [open, setOpen] = useState(false);
  const noteId = useId();
  return (
    <>
      <Badge tone={question.source === "past" ? "primary" : "neutral"}>{sourceLabel(question, m)}</Badge>
      {isReviewed(question) ? (
        <>
          <Badge tone="ok">{m.source.reviewed}</Badge>
          <button
            type="button"
            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-line bg-surface px-2 text-[0.8rem] font-bold text-ink underline underline-offset-2"
            aria-expanded={open}
            aria-controls={noteId}
            onClick={() => setOpen(!open)}
          >
            <span aria-hidden="true">ⓘ</span>
            {m.source.reviewInfoButton}
          </button>
          {open && (
            <p id={noteId} className="basis-full rounded-lg border border-line bg-surface-2 p-2.5 text-[0.95rem] font-normal text-ink">
              {m.source.reviewInfo}
            </p>
          )}
        </>
      ) : (
        question.reviewStatus === "unverified" && <Badge tone="warn">{m.source.unverified}</Badge>
      )}
    </>
  );
}
