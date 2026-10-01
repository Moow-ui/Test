"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { Stars } from "@/components/Stars";
import { circled } from "@/lib/format";
import { calcStars, getPassContribution } from "@/lib/scoring";
import type { Question } from "@/lib/types";
import { ReportForm } from "./ReportForm";

export interface QuestionCardProps {
  question: Question;
  /** 과목 › 단원 이름 (해설을 펼쳤을 때만 보인다) */
  location: string;
  chapterImportance: number;
  /** 고른 답 (아직 안 골랐으면 null) */
  chosen: number | null;
  onAnswer: (choice: number) => void;
  onNext: () => void;
  nextLabel: string;
}

/**
 * 한 화면에 한 문제. 실제 시험처럼 문제와 선지만 크게 보이고 나머지는 작게 두거나 접어 둔다.
 * 선지를 누르면 즉시 채점하고, 정답·한 줄 핵심·중요도·합격 가능성을 짧게 보여 준다.
 * 해설과 오류 신고는 눌러야 펼쳐진다.
 * 문제가 바뀔 때는 key 를 바꿔 다시 만들어지므로 해설·신고 창은 항상 닫힌 상태로 시작한다.
 */
export function QuestionCard({
  question,
  location,
  chapterImportance,
  chosen,
  onAnswer,
  onNext,
  nextLabel,
}: QuestionCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const answered = chosen !== null;
  const correct = chosen === question.answer;

  // 채점 직후: Enter 로 바로 넘어갈 수 있게 "다음" 버튼에 초점을 두고, 결과가 화면에 보이게 한다
  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ block: "nearest" });
  }, [answered]);

  const stars = calcStars(chapterImportance, question.frequency);
  const contribution = getPassContribution({
    questionId: question.id,
    chapterImportance,
    frequency: question.frequency,
  });

  return (
    <div>
      <h2 className="text-[1.15rem] font-bold leading-snug sm:text-xl sm:leading-normal">
        {question.stem}
      </h2>

      <ol className="mt-2.5 space-y-1.5 sm:mt-3 sm:space-y-2">
        {question.choices.map((choice, i) => {
          const n = i + 1;
          const isAnswer = n === question.answer;
          const isChosen = n === chosen;
          let style = "border-line bg-surface text-ink hover:border-ink";
          if (answered) {
            if (isAnswer) style = "border-ok bg-ok-soft text-ink";
            else if (isChosen) style = "border-bad bg-bad-soft text-ink";
            else style = "border-line-soft bg-surface text-ink";
          }
          return (
            <li key={n}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onAnswer(n)}
                className={`flex min-h-[3.2rem] w-full items-center gap-3 rounded-lg border-2 px-3 py-1.5 text-left text-lg leading-snug ${style}`}
              >
                <span aria-hidden="true" className="shrink-0 text-xl font-bold">
                  {circled(n)}
                </span>
                <span className="sr-only">{n}번</span>
                {/* 좁은 화면에서는 "정답/내가 고른 답" 표시가 선지 글자 아래 줄로 내려간다 */}
                <span className="flex min-w-0 flex-1 flex-col gap-x-3 sm:flex-row sm:items-center sm:justify-between">
                  <span>{choice}</span>
                  {answered && isAnswer && (
                    <span className="shrink-0 text-[0.8rem] font-extrabold text-ok">✔ 정답</span>
                  )}
                  {answered && isChosen && !isAnswer && (
                    <span className="shrink-0 text-[0.8rem] font-extrabold text-bad">✘ 내가 고른 답</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {answered && (
        <div ref={resultRef} className="mt-2.5 scroll-mb-4">
          <div
            role="status"
            className={`grid gap-x-4 gap-y-1.5 rounded-lg border-2 px-3 py-2 sm:grid-cols-[1fr_auto] ${
              correct ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"
            }`}
          >
            <div>
              <p className="font-extrabold">
                <span className={correct ? "text-ok" : "text-bad"}>{correct ? "정답" : "오답"}</span>
                <span className="mx-1.5" aria-hidden="true">
                  ·
                </span>
                정답: {circled(question.answer)}
              </p>
              <p className="text-[0.85rem]">
                <span className="font-bold">핵심:</span> {question.oneLineConcept}
              </p>
            </div>
            <div className="text-[0.8rem] sm:text-right">
              <p>
                중요도 <Stars value={stars} />
              </p>
              <p>
                이 문제를 맞혔다면 합격 가능성은?{" "}
                <strong className="text-lg font-extrabold">{contribution.value}%</strong>
              </p>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-expanded={showExplanation}
              onClick={() => setShowExplanation((v) => !v)}
              className="btn min-h-12 px-3 text-[0.9rem]"
            >
              {showExplanation ? "▲ 해설 접기" : "▼ 해설 보기"}
            </button>
            <button ref={nextRef} type="button" className="btn btn-primary btn-lg min-w-40" onClick={onNext}>
              {nextLabel}
            </button>
          </div>

          {showExplanation && (
            <div className="mt-2 rounded-lg border border-line bg-surface p-3 text-[0.95rem] sm:p-4">
              <p className="mb-2 text-[0.75rem] font-bold text-ink-sub">{location}</p>
              <Markdown text={question.explanation} />
              <button
                type="button"
                className="mt-3 text-[0.75rem] font-bold text-ink-sub underline underline-offset-2"
                aria-expanded={showReport}
                onClick={() => setShowReport((v) => !v)}
              >
                문제 오류 신고
              </button>
              {showReport && <ReportForm question={question} onClose={() => setShowReport(false)} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
