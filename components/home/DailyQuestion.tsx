"use client";

import Link from "next/link";
import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { QuestionBadges } from "@/components/quiz/QuestionBadges";
import { useDailyQuestion } from "@/lib/data/client";
import { circled } from "@/lib/format";
import { fmt, localeCountry, localePath } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";

/**
 * 홈 검색창 바로 아래의 "오늘의 1문제" (P15). 페이지를 옮기지 않고 그 자리에서 풀고 정답·해설을 본다.
 * 문제는 날짜마다 하나로 고정된다 (lib/daily.ts). 출처 배지는 시험 화면과 같은 규칙(QuestionBadges).
 * 보기는 모두 보여 준다 (난이도로 줄이지 않는다).
 */
export function DailyQuestion() {
  const { locale, m: all } = useMessages();
  const m = all.home;
  const daily = useDailyQuestion(localeCountry(locale));
  const [chosen, setChosen] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (daily === "none") return null;

  const [, month, day] = daily ? daily.date.split("-").map(Number) : [0, 0, 0];
  const q = daily?.question;
  const revealed = chosen !== null;
  const correct = q ? chosen === q.answer : false;

  return (
    <section aria-labelledby="daily-title" className="card mx-auto w-full max-w-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="daily-title" className="text-lg font-bold">
          <span className="text-accent">{m.dailyTitle}</span>
        </h2>
        {daily && (
          <span className="text-sm font-bold text-ink-sub">
            {fmt(m.dailyDate, { month, day })} · {daily.entry.certName}
          </span>
        )}
      </div>

      {!daily || !q ? (
        <p className="mt-4 text-ink-sub">{m.dailyLoading}</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <QuestionBadges question={q} />
          </div>
          <p className="mt-2 whitespace-pre-wrap font-bold leading-normal">{q.stem}</p>

          <ol className="mt-4 space-y-2">
            {q.choices.map((choice, i) => {
              const n = i + 1;
              const isAnswer = n === q.answer;
              const selected = chosen === n;
              let row = "bg-bg hover:bg-primary-soft";
              let bubble = "border-ink bg-surface text-ink";
              if (revealed && isAnswer) {
                row = "bg-ok-soft";
                bubble = "border-ok bg-ok text-surface";
              } else if (revealed && selected) {
                row = "bg-bad-soft";
                bubble = "border-bad bg-bad text-surface";
              }
              return (
                <li key={n}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={revealed}
                    onClick={() => setChosen(n)}
                    className={`flex min-h-12 w-full items-center gap-4 rounded-lg px-4 py-2 text-left leading-snug ${row}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-[1.6em] w-[1.6em] shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${bubble}`}
                    >
                      {n}
                    </span>
                    <span className="sr-only">{fmt(all.exam.choiceN, { n })}</span>
                    <span className="min-w-0 flex-1">{choice}</span>
                    {revealed && isAnswer && (
                      <span className="shrink-0 text-sm font-bold text-ok">{all.common.answer}</span>
                    )}
                    {revealed && selected && !isAnswer && (
                      <span className="shrink-0 text-sm font-bold text-bad">{all.common.myChoice}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {revealed && (
            <div role="status" className={`mt-4 rounded-lg p-4 ${correct ? "bg-ok-soft" : "bg-bad-soft"}`}>
              <p className="text-lg font-bold">
                {correct ? (
                  <span className="text-ok">{fmt(all.exam.answerIs, { answer: circled(q.answer) })}</span>
                ) : (
                  <>
                    <span className="text-bad">{all.exam.wrong}</span>
                    <span className="mx-2" aria-hidden="true">
                      ·
                    </span>
                    {fmt(all.exam.answerIs, { answer: circled(q.answer) })}
                  </>
                )}
              </p>
              <p className="mt-2">
                <span className="font-bold">{all.common.keyConcept}</span> {q.oneLineConcept}
              </p>
              <button
                type="button"
                aria-expanded={showExplanation}
                onClick={() => setShowExplanation((v) => !v)}
                className="btn mt-4 bg-surface"
              >
                {showExplanation ? all.exam.hideExplanation : all.exam.showExplanation}
              </button>
              {showExplanation && (
                <div className="mt-4 space-y-2">
                  <Markdown text={q.explanation} />
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-right">
            <Link
              href={localePath(locale, `/cert/${daily.entry.certId}`)}
              className="link inline-flex min-h-11 items-center"
            >
              {fmt(m.dailyMore, { name: daily.entry.certName })}
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
