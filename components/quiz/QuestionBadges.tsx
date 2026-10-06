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
 * 문제 출처 배지: "2025년 제36회 기출" 또는 "예상문제". 기출은 배지 옆 작은 "출처" 버튼을 누르면 출처·이용 조건이 펼쳐진다 (풀이에 방해되지 않게 접어 둔다).
 * 검증을 통과한 예상문제는 "검수 완료" + ⓘ 버튼(누르면 검수 방식 안내. AI 로 만들고 검증했다는 설명은 여기에 나온다), 검증 기록이 없으면 "검수 전".
 */
export function QuestionBadges({ question }: { question: Pick<Question, "source" | "pastInfo" | "reviewStatus"> }) {
  const { m } = useMessages();
  const [open, setOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const noteId = useId();
  const creditId = useId();
  const credit = pastCredit(question, m);
  return (
    <>
      <Badge tone={question.source === "past" ? "primary" : "neutral"}>{sourceLabel(question, m)}</Badge>
      {credit && (
        <CreditButton label={m.source.creditButton} open={creditOpen} controls={creditId} onClick={() => setCreditOpen(!creditOpen)} />
      )}
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
      {credit && creditOpen && (
        <p id={creditId} className="basis-full rounded-lg bg-surface-2 px-4 py-2 text-sm font-normal text-ink">
          {credit}
        </p>
      )}
    </>
  );
}

/** 기출 배지 옆의 작은 "출처" 버튼 (누르면 출처·이용 조건 한 줄이 펼쳐진다) */
export function CreditButton({
  label,
  open,
  controls,
  onClick,
}: {
  label: string;
  open: boolean;
  controls?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center rounded-full border border-line px-3 text-sm font-normal text-ink-sub hover:bg-surface-2"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
