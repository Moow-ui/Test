import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "ok" | "warn" | "bad";

const TONE: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-ink",
  primary: "border-primary bg-primary-soft text-ink",
  ok: "border-ok bg-ok-soft text-ok",
  warn: "border-warn bg-warn-soft text-warn",
  bad: "border-bad bg-bad-soft text-bad",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[0.8rem] font-bold ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
