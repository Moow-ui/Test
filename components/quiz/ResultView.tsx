"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { Markdown } from "@/components/Markdown";
import { circled, formatScore } from "@/lib/format";
import { gradeQuiz, summarize } from "@/lib/grading";
import {
  EMPTY_NOTES,
  STORAGE_KEYS,
  addNotes,
  startSession,
  type NoteEntry,
} from "@/lib/storage";
import type { Question } from "@/lib/types";
import { useStored } from "@/lib/use-storage";
import type { QuizCert } from "./QuizRunner";

/** 이 문항 수보다 적게 풀었으면 합격 판정은 "참고용"이라고 알려 준다 */
const RELIABLE_QUESTION_COUNT = 20;

/** 결과 화면: 점수, 과목별 정답률, 합격 기준 대비 판정, 약점 단원, 다시 풀기·오답노트 */
export function ResultView({
  cert,
  label,
  answers,
  questions,
  againAction,
}: {
  cert: QuizCert;
  /** 풀이 이름 (예: "초급 · 전체 과목", "실전 CBT 체험") */
  label: string;
  /** 문제 id → 고른 답 */
  answers: Record<string, number>;
  questions: Question[];
  /** "새 문제로 다시 풀기" 자리에 들어갈 버튼/링크 */
  againAction: ReactNode;
}) {
  const router = useRouter();
  const notes = useStored<NoteEntry[]>(STORAGE_KEYS.notes, EMPTY_NOTES);

  const graded = gradeQuiz(questions, answers);
  const summary = summarize(graded, cert);
  const verdict = summary.verdict;
  const wrong = graded.filter((g) => !g.correct);
  const allSaved = wrong.length > 0 && wrong.every((w) => notes.some((n) => n.questionId === w.questionId));
  const criteria = cert.examInfo.passCriteria;

  const retryWrong = () => {
    startSession({
      certId: cert.id,
      mode: "retry",
      label: "틀린 문제 다시 풀기",
      level: null,
      subjectId: null,
      questionIds: wrong.map((w) => w.questionId),
    });
    window.scrollTo(0, 0);
    router.push(`/cert/${cert.id}/quiz`);
  };

  const saveNotes = () => {
    addNotes(wrong.map((w) => ({ questionId: w.questionId, certId: cert.id, chosen: w.chosen })));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-[0.9rem] font-bold text-ink-sub">
          {cert.name} · {label}
        </p>
        <h1 className="text-2xl font-extrabold">풀이 결과</h1>
      </header>

      <section aria-label="점수" className="card p-4 sm:p-5">
        <p className="text-lg">
          {summary.total}문제 중 <strong className="text-2xl">{summary.correct}문제</strong> 정답
        </p>
        <p className="mt-1 text-4xl font-extrabold">{formatScore(summary.score)}점</p>

        {verdict && (
          <div
            className={`mt-4 rounded-lg border-2 p-3 ${
              verdict.passed ? "border-ok bg-ok-soft" : "border-bad bg-bad-soft"
            }`}
          >
            <p className="text-lg font-extrabold">
              실제 합격 기준으로 보면:{" "}
              <span className={verdict.passed ? "text-ok" : "text-bad"}>
                {verdict.passed ? "합격선 통과 ✔" : "합격선 미달 ✘"}
              </span>
            </p>
            <p className="mt-1 text-[0.95rem]">합격 기준: {criteria.description}</p>
            {verdict.failedSubjects.length > 0 && (
              <p className="mt-1 text-[0.95rem] font-bold">
                과락 과목: {verdict.failedSubjects.map((s) => `${s.name}(${formatScore(s.score)}점)`).join(", ")}
                {" — "}과목별 {verdict.subjectMinScore}점 미만이면 평균이 높아도 불합격입니다.
              </p>
            )}
            {summary.total < RELIABLE_QUESTION_COUNT && (
              <p className="mt-1 text-[0.9rem]">
                ※ 문항 수가 적어 참고용입니다. 실전 CBT 체험 모드로 전체 문항을 풀면 더 정확하게 알
                수 있습니다.
              </p>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="by-subject-title">
        <h2 id="by-subject-title" className="text-xl font-extrabold">
          과목별 정답률
        </h2>
        <ul className="mt-2 space-y-2">
          {summary.bySubject.map((s) => {
            const failed = verdict?.failedSubjects.some((f) => f.id === s.id);
            return (
              <li key={s.id} className="card p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-bold">{s.name}</span>
                  <span className="font-bold">
                    {s.correct} / {s.total}문제 · {formatScore(s.score)}%
                    {failed && <span className="ml-2 text-bad">과락</span>}
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${s.name} 정답률 ${formatScore(s.score)}%`}
                  className="mt-1.5 h-4 overflow-hidden rounded border border-line bg-surface-2"
                >
                  <div className="h-full bg-primary" style={{ width: `${s.score}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {wrong.length > 0 && (
        <section aria-labelledby="concepts-title" className="rounded-xl border-2 border-primary bg-primary-soft p-4">
          <h2 id="concepts-title" className="text-xl font-extrabold">
            틀린 핵심 개념
            <span className="ml-2 text-[0.95rem] font-bold">다음번엔 이것만 더 기억하세요</span>
          </h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-6">
            {questions
              .filter((q, i) => !graded[i].correct)
              .map((q) => (
                <li key={q.id} className="font-bold">
                  {q.oneLineConcept}
                </li>
              ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="weak-title">
        <h2 id="weak-title" className="text-xl font-extrabold">
          약한 단원 (정답률 낮은 순)
        </h2>
        {summary.weakChapters.length === 0 ? (
          <p className="card mt-2 p-3 font-bold">틀린 문제가 없습니다. 훌륭합니다!</p>
        ) : (
          <ol className="mt-2 space-y-2">
            {summary.weakChapters.map((c, i) => (
              <li key={c.id} className="card flex flex-wrap items-center justify-between gap-2 p-3">
                <span>
                  <span className="font-extrabold">{i + 1}. {c.name}</span>
                  <span className="ml-2 text-[0.9rem] font-bold text-ink-sub">
                    {c.total}문제 중 {c.correct}문제 정답 ({formatScore(c.score)}%)
                  </span>
                </span>
                <Link href={`/cert/${cert.id}/${c.id}`} className="link">
                  핵심정리 보기 →
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-label="다음에 할 일" className="grid gap-2 sm:grid-cols-2">
        {wrong.length > 0 && (
          <>
            <button type="button" className="btn btn-primary btn-lg" onClick={retryWrong}>
              틀린 문제 {wrong.length}개 다시 풀기 →
            </button>
            {allSaved ? (
              <Link href={`/cert/${cert.id}/notes`} className="btn btn-lg">
                ✔ 오답노트에 저장됨 · 오답노트 보기
              </Link>
            ) : (
              <button type="button" className="btn btn-lg" onClick={saveNotes}>
                틀린 문제 {wrong.length}개 오답노트에 저장
              </button>
            )}
          </>
        )}
        {againAction}
        <Link href={`/cert/${cert.id}`} className="btn btn-lg">
          {cert.name} 페이지로 가기
        </Link>
      </section>

      <section aria-labelledby="review-title" className="cv">
        <h2 id="review-title" className="text-xl font-extrabold">
          문제별 결과
        </h2>
        <ol className="mt-2 space-y-2">
          {questions.map((q, i) => {
            const g = graded[i];
            return (
              <li key={q.id}>
                <details className="card">
                  <summary className="flex min-h-14 items-center gap-2 p-3">
                    <span className={`shrink-0 font-extrabold ${g.correct ? "text-ok" : "text-bad"}`}>
                      {g.correct ? "✔ 정답" : "✘ 오답"}
                    </span>
                    <span className="flex-1 font-bold">
                      {i + 1}. {q.stem}
                    </span>
                    <span className="shrink-0 text-[0.9rem] font-bold text-accent">
                      <span className="when-closed">▼ 보기</span>
                      <span className="when-open">▲ 접기</span>
                    </span>
                  </summary>
                  <div className="space-y-2 border-t border-line-soft p-3">
                    <ol className="space-y-1">
                      {q.choices.map((choice, ci) => (
                        <li key={ci} className={ci + 1 === q.answer ? "font-bold" : ""}>
                          {circled(ci + 1)} {choice}
                          {ci + 1 === q.answer && <span className="ml-2 text-ok">← 정답</span>}
                          {ci + 1 === g.chosen && ci + 1 !== q.answer && (
                            <span className="ml-2 font-bold text-bad">← 내가 고른 답</span>
                          )}
                        </li>
                      ))}
                    </ol>
                    <p>
                      <span className="font-bold">핵심:</span> {q.oneLineConcept}
                    </p>
                    <div className="rounded-lg border border-line-soft p-3">
                      <Markdown text={q.explanation} />
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>

      <AdSlot position="result-bottom" />
    </div>
  );
}
