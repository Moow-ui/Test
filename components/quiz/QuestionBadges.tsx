"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/Badge";
import { pastCredit, sourceLabel } from "@/lib/format";
import type { Question } from "@/lib/types";
import { useMessages } from "@/lib/use-messages";

/** AI 검증을 통과한 예상문제인가 ("검수 완료"로 표시). 기출은 출처 표기만 한다 */
export function isReviewed(question: Pick<Question, "source" | "reviewStatus">): boolean {
  return question.source === "predicted" && question.reviewStatus === "verified";
}

/**
 * 문제 출처 배지: "2025년 제36회 기출" 또는 "예상문제". 기출은 아래에 출처·이용 조건 한 줄이 붙는다.
 * 검증을 통과한 예상문제는 "검수 완료" + ⓘ 버튼(누르면 검수 방식 안내. AI 로 만들고 검증했다는 설명은 여기에 나온다), 검증 기록이 없으면 "검수 전".
 */
export function QuestionBadges({ question }: { question: Pick<Question, "source" | "pastInfo" | "reviewStatus"> }) {
  const { m } = useMessages();
  const [open, setOpen] = useState(false);
  const noteId = useId();
  const credit = pastCredit(question, m);
  return (
    <>
      <Badge tone={question.source === "past" ? "primary" : "neutral"}>{sourceLabel(question, m)}</Badge>
      {isReviewed(question) ? (
        <>
          <Badge tone="ok">{m.source.reviewed}</Badge>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[20px] leading-none text-ink-sub hover:bg-surface-2"
            aria-label={m.source.reviewInfoButton}
            title={m.source.reviewInfoButton}
            aria-expanded={open}
            aria-controls={noteId}
            onClick={() => setOpen(!open)}
          >
            <span aria-hidden="true">ⓘ</span>
          </button>
          {open && (
            <p id={noteId} className="basis-full rounded-lg bg-surface-2 px-4 py-2 text-sm font-normal text-ink">
              {m.source.reviewInfo}
            </p>
          )}
        </>
      ) : (
        question.reviewStatus === "unverified" && <Badge tone="warn">{m.source.unverified}</Badge>
      )}
      {credit && <p className="basis-full text-sm font-normal text-ink-sub">{credit}</p>}
    </>
  );
}
