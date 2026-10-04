import { Markdown } from "@/components/Markdown";
import { Stars } from "@/components/Stars";
import { QuestionBadges } from "@/components/quiz/QuestionBadges";
import { circled } from "@/lib/format";
import { fmt, getMessages, type Locale } from "@/lib/i18n";
import { calcStars } from "@/lib/scoring";
import type { Question } from "@/lib/types";

/**
 * 서버에서 HTML 로 그려지는 문제 한 건 (기출 페이지·단원 페이지용).
 * 풀이 화면은 JS 로 동작해 검색엔진이 문제 내용을 못 읽으므로,
 * 여기서는 문제·선지·정답·해설을 모두 HTML 본문에 넣는다.
 * 정답과 해설은 접어 두지만(details) 페이지 소스에는 그대로 들어 있다.
 */
export function StaticQuestion({
  locale,
  question,
  number,
  location,
  chapterImportance,
}: {
  locale: Locale;
  question: Question;
  number: number;
  location: string;
  chapterImportance: number;
}) {
  const m = getMessages(locale);
  return (
    <article className="cv card p-4 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <QuestionBadges
          question={{ source: question.source, pastInfo: question.pastInfo, reviewStatus: question.reviewStatus }}
        />
        <span className="text-sm font-bold text-ink-sub">{location}</span>
        <span className="text-sm">
          <Stars value={calcStars(chapterImportance, question.frequency)} />
        </span>
      </div>
      <h3 className="mt-2 whitespace-pre-wrap text-lg font-bold leading-normal">
        {fmt(m.question.numbered, { n: number })} {question.stem}
      </h3>
      <ol className="mt-2 space-y-2 text-lg">
        {question.choices.map((choice, i) => (
          <li key={i}>
            {circled(i + 1)} {choice}
          </li>
        ))}
      </ol>
      <details className="mt-4 rounded-lg bg-surface-2">
        <summary className="flex min-h-12 items-center px-4 font-bold text-accent">
          <span className="when-closed">{m.question.showAnswer}</span>
          <span className="when-open">{m.question.hideAnswer}</span>
        </summary>
        <div className="space-y-2 p-4">
          <p className="text-lg font-bold">
            {m.question.answerIs} {circled(question.answer)} {question.choices[question.answer - 1]}
          </p>
          <p>
            <span className="font-bold">{m.common.keyConcept}</span> {question.oneLineConcept}
          </p>
          <Markdown text={question.explanation} />
        </div>
      </details>
    </article>
  );
}
