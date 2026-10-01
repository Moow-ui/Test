"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { AdSlot } from "@/components/AdSlot";
import { LEVEL_RULES, QUIZ_COUNTS, buildLevelQuiz, buildQuiz } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  getHistory,
  finishSession,
  getNotes,
  recordAnswer,
  saveSession,
  setLastLevel,
  startSession,
  touchRecentCert,
  type QuizSession,
} from "@/lib/storage";
import type { ExamInfo, Question, QuizLevel, Subject } from "@/lib/types";
import { useHydrated, useStored } from "@/lib/use-storage";
import { QuestionCard } from "./QuestionCard";
import { ResultView } from "./ResultView";

export interface QuizCert {
  id: string;
  name: string;
  subjects: Subject[];
  examInfo: ExamInfo;
}

const LEVELS: QuizLevel[] = ["basic", "intermediate", "advanced"];

/**
 * 주소의 시작 조건(?level=…&count=…&subject=… 등)으로 새 풀이를 만들어 저장한다.
 * 만들 수 없으면 null.
 */
function createSession(
  cert: QuizCert,
  questions: Question[],
  params: URLSearchParams,
): QuizSession | null {
  const history = getHistory();

  // 오답노트에 담아 둔 문제 다시 풀기
  if (params.get("mode") === "notes") {
    const ids = getNotes()
      .filter((n) => n.certId === cert.id)
      .map((n) => n.questionId)
      .filter((id) => questions.some((q) => q.id === id));
    if (ids.length === 0) return null;
    return startSession({
      certId: cert.id,
      mode: "notes",
      label: "오답노트 다시 풀기",
      level: null,
      subjectId: null,
      questionIds: ids,
    });
  }

  // 단원 하나만 풀기 (단원별 핵심정리 페이지의 "이 단원 문제 풀기")
  const chapterId = params.get("chapter");
  if (chapterId) {
    const subject = cert.subjects.find((s) => s.chapters.some((c) => c.id === chapterId));
    const chapter = subject?.chapters.find((c) => c.id === chapterId);
    if (!subject || !chapter) return null;
    const picked = buildQuiz({
      subjects: [{ ...subject, chapters: [chapter] }],
      pool: questions.filter((q) => q.chapterId === chapterId),
      count: Number(params.get("count")) || QUIZ_COUNTS[0],
      history,
    });
    if (picked.length === 0) return null;
    return startSession({
      certId: cert.id,
      mode: "chapter",
      label: `${chapter.name} 단원`,
      level: null,
      subjectId: subject.id,
      questionIds: picked.map((q) => q.id),
    });
  }

  // 난이도 카드(초급/중급/고급)로 풀기
  const level = LEVELS.find((l) => l === params.get("level"));
  if (!level) return null;
  const requested = Number(params.get("count"));
  const count = QUIZ_COUNTS.find((c) => c === requested) ?? QUIZ_COUNTS[0];
  const subjectParam = params.get("subject");
  const subject = cert.subjects.find((s) => s.id === subjectParam);
  const picked = buildLevelQuiz({
    subjects: cert.subjects,
    questions,
    level,
    count,
    subjectId: subject?.id ?? "all",
    history,
  });
  if (picked.length === 0) return null;
  setLastLevel(level);
  return startSession({
    certId: cert.id,
    mode: "level",
    label: `${LEVEL_RULES[level].label} · ${subject ? subject.name : "전체 과목"}`,
    level,
    subjectId: subject?.id ?? null,
    questionIds: picked.map((q) => q.id),
  });
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="card mx-auto max-w-3xl space-y-3 p-5">{children}</div>;
}

/** 풀이 화면: 새 풀이 시작 / 이어서 풀기 / 채점 / 결과 */
export function QuizRunner({ cert, questions }: { cert: QuizCert; questions: Question[] }) {
  const router = useRouter();
  const paramString = useSearchParams().toString();
  const hydrated = useHydrated();
  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(cert.id), null);
  const handledRef = useRef<string | null>(null);

  // 주소에 시작 조건이 있으면 새 풀이를 만들어 저장한 뒤, 주소에서 조건을 지운다.
  // (새로고침해도 문제가 다시 섞이지 않고 "이어서 풀기"가 되도록)
  useEffect(() => {
    if (!paramString) {
      handledRef.current = null;
      return;
    }
    if (handledRef.current === paramString) return;
    handledRef.current = paramString;
    createSession(cert, questions, new URLSearchParams(paramString));
    touchRecentCert(cert.id);
    router.replace(`/cert/${cert.id}/quiz`);
  }, [paramString, cert, questions, router]);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const sessionQuestions = session
    ? session.questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q)
    : [];
  const total = sessionQuestions.length;
  const index = session ? Math.min(session.currentIndex, Math.max(0, total - 1)) : 0;
  const question = sessionQuestions[index];
  const chosen = session && question ? (session.answers[question.id] ?? null) : null;
  const active = hydrated && !paramString && !!session && !session.finishedAt && !!question;

  const answer = (choice: number) => {
    if (!session || !question || chosen !== null) return;
    saveSession({ ...session, currentIndex: index, answers: { ...session.answers, [question.id]: choice } });
    recordAnswer(question.id, choice === question.answer);
  };

  const next = () => {
    if (!session || chosen === null) return;
    window.scrollTo(0, 0);
    if (index + 1 >= total) finishSession(session);
    else saveSession({ ...session, currentIndex: index + 1 });
  };

  // 키보드: 1~4 답 선택, Enter 다음 문제
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (["1", "2", "3", "4"].includes(e.key)) {
        if (chosen === null) {
          e.preventDefault();
          answer(Number(e.key));
        }
      } else if (e.key === "Enter" && chosen !== null) {
        // 버튼·링크에 초점이 있으면 브라우저가 그 버튼을 누르므로 여기서는 처리하지 않는다
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!hydrated || paramString) {
    return (
      <Notice>
        <p className="text-lg font-bold">문제를 준비하고 있습니다…</p>
      </Notice>
    );
  }

  if (!session || total === 0) {
    return (
      <Notice>
        <h1 className="text-xl font-extrabold">진행 중인 풀이가 없습니다</h1>
        <p>난이도와 문항 수를 고르면 바로 시작할 수 있습니다.</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/cert/${cert.id}/quiz?level=basic&count=5&subject=all`} className="btn btn-primary btn-lg">
            바로 5문제 풀기 →
          </Link>
          <Link href={`/cert/${cert.id}`} className="btn btn-lg">
            {cert.name} 페이지로 가기
          </Link>
        </div>
      </Notice>
    );
  }

  if (session.finishedAt) {
    return <ResultView cert={cert} session={session} questions={sessionQuestions} />;
  }

  const subject = cert.subjects.find((s) => s.id === question.subjectId);
  const chapter = subject?.chapters.find((c) => c.id === question.chapterId);
  const answeredCount = sessionQuestions.filter((q) => session.answers[q.id] !== undefined).length;
  const isLast = index + 1 >= total;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-2 text-[0.9rem]">
        <h1 className="font-bold">
          {cert.name} · {session.label}
        </h1>
        <Link href={`/cert/${cert.id}`} className="link shrink-0">
          나가기
        </Link>
      </div>
      <div className="mt-1 flex items-center gap-3">
        <p className="shrink-0 font-extrabold">
          문제 {index + 1} / {total}
        </p>
        <div
          role="progressbar"
          aria-label="진행률"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          className="h-3 flex-1 overflow-hidden rounded-full border border-line bg-surface-2"
        >
          <div className="h-full bg-primary" style={{ width: `${(answeredCount / total) * 100}%` }} />
        </div>
      </div>

      <div className="mt-3">
        <QuestionCard
          key={question.id}
          question={question}
          location={`${subject?.name ?? ""} › ${chapter?.name ?? ""}`}
          chapterImportance={chapter?.importance ?? 3}
          chosen={chosen}
          onAnswer={answer}
          onNext={next}
          nextLabel={isLast ? "결과 보기 →" : "다음 문제 →"}
        />
      </div>

      <p className="mt-6 hidden text-[0.85rem] text-ink-sub md:block">
        키보드로도 풀 수 있습니다: 숫자 1~4 로 답 선택, Enter 로 다음 문제.
      </p>

      <AdSlot position="quiz-bottom" />
    </div>
  );
}
