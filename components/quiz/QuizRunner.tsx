"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ExamScreen } from "@/components/exam/ExamScreen";
import { LEVEL_RULES, QUIZ_COUNTS, buildLevelQuiz, buildQuiz } from "@/lib/quiz-engine";
import {
  STORAGE_KEYS,
  addResult,
  getHistory,
  finishSession,
  getNotes,
  recordAnswer,
  saveSession,
  setInstantCheck,
  setLastLevel,
  startSession,
  touchRecentCert,
  type QuizSession,
} from "@/lib/storage";
import type { ExamInfo, Question, QuizLevel, Subject } from "@/lib/types";
import { useHydrated, useStored } from "@/lib/use-storage";
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

/** 시험 화면이 아닌 안내·결과는 여백을 두고 가운데에 보여 준다 */
function Pad({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:py-6">{children}</div>;
}

/** 풀이 화면: 새 풀이 시작 / 이어서 풀기 / (바로 또는 마지막에) 채점 / 결과 */
export function QuizRunner({ cert, questions }: { cert: QuizCert; questions: Question[] }) {
  const router = useRouter();
  const paramString = useSearchParams().toString();
  const hydrated = useHydrated();
  const session = useStored<QuizSession | null>(STORAGE_KEYS.session(cert.id), null);
  // "바로 답 확인하기": 기본은 켜짐
  const instant = useStored<boolean>(STORAGE_KEYS.instantCheck, true);
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

  if (!hydrated || paramString) {
    return (
      <Pad>
        <p className="card p-5 text-lg font-bold">문제를 준비하고 있습니다…</p>
      </Pad>
    );
  }

  if (!session || total === 0) {
    return (
      <Pad>
        <div className="card mx-auto max-w-3xl space-y-3 p-5">
          <h1 className="text-xl font-extrabold">진행 중인 풀이가 없습니다</h1>
          <Link href={`/cert/${cert.id}`} className="btn btn-primary btn-lg">
            {cert.name} 화면에서 시작하기 →
          </Link>
        </div>
      </Pad>
    );
  }

  if (session.finishedAt) {
    const againHref =
      session.mode === "level" && session.level
        ? `/cert/${cert.id}/quiz?level=${session.level}&count=${total}&subject=${session.subjectId ?? "all"}`
        : `/cert/${cert.id}/quiz?level=basic&count=5&subject=all`;
    return (
      <Pad>
        <ResultView
          cert={cert}
          label={session.label}
          answers={session.answers}
          questions={sessionQuestions}
          againAction={
            <Link href={againHref} className="btn btn-lg">
              새 문제로 다시 풀기 →
            </Link>
          }
        />
      </Pad>
    );
  }

  const revealed = session.revealed ?? {};
  const index = Math.min(session.currentIndex, total - 1);

  /** 보기를 고른다. "바로 답 확인하기"가 켜져 있으면 그 자리에서 채점하고 답을 잠근다 */
  const select = (question: Question, choice: number) => {
    if (revealed[question.id]) return;
    saveSession({
      ...session,
      answers: { ...session.answers, [question.id]: choice },
      revealed: instant ? { ...revealed, [question.id]: true } : revealed,
    });
    if (instant) recordAnswer(question.id, choice === question.answer, cert.id);
  };

  /** 체크박스를 다시 켜면, 지금 보고 있는 문제에 이미 고른 답이 있을 때 바로 채점해 보여 준다 */
  const changeInstant = (checked: boolean) => {
    setInstantCheck(checked);
    const current = sessionQuestions[index];
    const chosen = session.answers[current.id];
    if (checked && chosen !== undefined && !revealed[current.id]) {
      saveSession({ ...session, revealed: { ...revealed, [current.id]: true } });
      recordAnswer(current.id, chosen === current.answer, cert.id);
    }
  };

  /** 채점: 아직 확인하지 않은 답까지 풀이 기록에 남기고 결과 화면으로 넘어간다 */
  const submit = () => {
    for (const q of sessionQuestions) {
      const chosen = session.answers[q.id];
      if (chosen !== undefined && !revealed[q.id]) recordAnswer(q.id, chosen === q.answer, cert.id);
    }
    const wrongIds = sessionQuestions.filter((q) => session.answers[q.id] !== q.answer).map((q) => q.id);
    addResult({
      certId: cert.id,
      label: session.label,
      kind: "quiz",
      total,
      correct: total - wrongIds.length,
      score: Math.round(((total - wrongIds.length) / total) * 100),
      wrongIds,
    });
    finishSession(session);
    window.scrollTo(0, 0);
  };

  const metaOf = (q: Question) => {
    const subject = cert.subjects.find((s) => s.id === q.subjectId);
    const chapter = subject?.chapters.find((c) => c.id === q.chapterId);
    return {
      location: `${subject?.name ?? ""} › ${chapter?.name ?? ""}`,
      chapterImportance: chapter?.importance ?? 3,
    };
  };

  return (
    <ExamScreen
      certName={cert.name}
      modeLabel={session.label}
      exitHref={`/cert/${cert.id}`}
      questions={sessionQuestions}
      index={index}
      answers={session.answers}
      revealed={revealed}
      instant={{ checked: instant, onChange: changeInstant }}
      submitLabel="채점하기"
      onSelect={select}
      onGoTo={(i) => saveSession({ ...session, currentIndex: i })}
      onSubmit={submit}
      metaOf={metaOf}
    />
  );
}
