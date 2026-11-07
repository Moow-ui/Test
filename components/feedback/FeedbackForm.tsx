"use client";

import { useState } from "react";
import { errorText } from "@/components/auth/AuthForm";
import { sendFeedback } from "@/lib/cheer-client";
import { FEEDBACK_BODY_MAX, checkFeedback } from "@/lib/feedback-rules";
import { fmt } from "@/lib/i18n";
import { textLength } from "@/lib/review-rules";
import { useMessages } from "@/lib/use-messages";

/** 개선 의견 쓰기. 보낸 의견은 공개되지 않고 관리자 화면에서만 보인다 */
export function FeedbackForm() {
  const { locale, m: all } = useMessages();
  const m = all.feedback;
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    const checked = checkFeedback({ locale, body });
    if ("error" in checked) return setError(checked.error);
    setBusy(true);
    const failure = await sendFeedback(checked.data);
    setBusy(false);
    if (failure) return setError(failure);
    setSent(true);
    setBody("");
  };

  if (sent) {
    return (
      <div className="card space-y-4 p-6">
        <p role="status" className="rounded-lg bg-ok-soft p-4 text-lg font-bold">
          {m.sent}
        </p>
        <button type="button" className="btn" onClick={() => setSent(false)}>
          {m.writeAgain}
        </button>
      </div>
    );
  }

  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <label htmlFor="feedback-body" className="block font-bold">
          {m.body}
        </label>
        <textarea
          id="feedback-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={7}
          maxLength={FEEDBACK_BODY_MAX}
          className="mt-2 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink"
        />
        <p className="text-right text-sm font-bold text-ink-sub">
          {fmt(m.bodyCount, { n: textLength(body.trim()), max: FEEDBACK_BODY_MAX })}
        </p>
      </div>
      <p className="text-sm text-ink-sub">{m.privacyHint}</p>
      {error && (
        <p role="alert" className="rounded-lg bg-bad-soft p-2 font-bold">
          {errorText(all, error)}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn btn-primary">
        {m.submit}
      </button>
    </form>
  );
}
