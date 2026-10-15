// @vitest-environment happy-dom
/**
 * 회귀 테스트 (P11): 시험 화면의 "예상문제 · 검수 완료 ⓘ" 배지가 문제를 넘길수록 쌓이던 버그.
 * 원인: 배지와 채점 결과(바로 답 확인하기)가 같은 key(문제 id)를 한 부모 안에서 함께 써서,
 * React 가 문제를 넘길 때 이전 배지를 지우지 못했다.
 */
import { createElement, useState } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/lib/types";

vi.mock("next/navigation", () => ({ useParams: () => ({ lang: "ko" }), usePathname: () => "/ko" }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: unknown }) =>
    createElement("a", { href, ...rest }, children as never),
}));

const { ExamScreen } = await import("@/components/exam/ExamScreen");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function makeQuestion(n: number): Question {
  return {
    id: `test-c1-${String(n).padStart(4, "0")}`,
    subjectId: "s1",
    chapterId: "c1",
    level: "basic",
    source: "predicted",
    reviewStatus: "verified",
    reviewedAt: "2026-10-01",
    stem: `문제 ${n}`,
    choices: ["가", "나", "다", "라"],
    answer: 1,
    explanation: "해설",
    oneLineConcept: "핵심",
    frequency: 3,
  } as unknown as Question;
}

const QUESTIONS = [1, 2, 3, 4, 5].map(makeQuestion);

/** QuizRunner 처럼 현재 번호·답·"바로 답 확인하기" 상태를 들고 ExamScreen 을 그린다 */
function Harness() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  return createElement(ExamScreen, {
    certName: "테스트",
    modeLabel: "초급",
    exitHref: "/ko",
    questions: QUESTIONS,
    level: null,
    index,
    answers,
    revealed,
    instant: { checked: true, onChange: () => {} },
    submitKind: "grade",
    onSelect: (q, choice) => {
      setAnswers((a) => ({ ...a, [q.id]: choice }));
      setRevealed((r) => ({ ...r, [q.id]: true }));
    },
    onGoTo: setIndex,
    onSubmit: () => {},
    metaOf: () => ({ location: "1과목", chapterImportance: 3 }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.scrollTo = () => {};
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(createElement(Harness));
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const badges = () => container.querySelectorAll("[data-review-badge]");
const infoButtons = () => container.querySelectorAll('button[aria-label="검수 방식"]');
const button = (text: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text)) as HTMLButtonElement;
const click = (el: Element) => act(() => (el as HTMLElement).click());
const answerFirstChoice = () => click(container.querySelector("section ol li button")!);
const expectOneBadge = () => {
  expect(container.textContent!.match(/검수 완료/g)).toHaveLength(1);
  expect(infoButtons()).toHaveLength(1);
  expect(badges()).toHaveLength(1);
};

describe("시험 화면 출처 배지", () => {
  it("1→5 로 넘기며 답을 확인해도 배지는 1개", () => {
    for (let i = 0; i < 5; i++) {
      answerFirstChoice();
      expectOneBadge();
      if (i < 4) click(button("다음"));
      expectOneBadge();
    }
    expect(container.querySelector("section h2")!.textContent).toContain("5.");
  });

  it("5→1 로 돌아와도 배지는 1개", () => {
    for (let i = 0; i < 4; i++) {
      answerFirstChoice();
      click(button("다음"));
    }
    for (let i = 0; i < 4; i++) {
      click(button("이전"));
      expectOneBadge();
    }
    expect(container.querySelector("section h2")!.textContent).toContain("1.");
  });

  it("글자크기를 바꿔도 배지는 1개", () => {
    answerFirstChoice();
    click(button("다음"));
    answerFirstChoice();
    const sizes = [...container.querySelectorAll('[role="group"] button')];
    expect(sizes.length).toBeGreaterThan(1);
    for (const size of sizes) {
      click(size);
      expectOneBadge();
    }
    click(button("이전"));
    expectOneBadge();
  });

  it("ⓘ 를 누르면 안내문이 펼쳐지고, 다음 문제에서는 다시 접힌다", () => {
    click(infoButtons()[0]);
    expect(container.textContent).toContain("정답을 가린 별도 AI");
    click(button("다음"));
    expect(container.textContent).not.toContain("정답을 가린 별도 AI");
    expectOneBadge();
  });
});
