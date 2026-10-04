import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "ok" | "warn" | "bad";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink",
  primary: "bg-primary-soft text-ink",
  ok: "bg-ok-soft text-ok",
  warn: "bg-surface-2 text-ink-sub",
  bad: "bg-bad-soft text-bad",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
