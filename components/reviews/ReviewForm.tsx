"use client";

import { useState } from "react";
import { errorText } from "@/components/auth/AuthForm";
import { useAuth } from "@/lib/auth-client";
import { fmt } from "@/lib/i18n";
import { sendReview } from "@/lib/review-client";
import {
  REVIEW_BODY_MAX,
  REVIEW_NICKNAME_MAX,
  REVIEW_STATUSES,
  checkReview,
  textLength,
  type ReviewItem,
  type ReviewStatus,
} from "@/lib/review-rules";
import { useMessages } from "@/lib/use-messages";

const inputClass = "mt-1 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink";

/** 후기 쓰기: 별점·지금 상태·한 줄 후기·닉네임. 로그인하지 않아도 쓸 수 있고, 로그인했으면 닉네임이 자동으로 들어간다 */
export function ReviewForm({
  certId,
  onSaved,
  onClose,
}: {
  certId: string;
  onSaved: (review: ReviewItem) => void;
  onClose: () => void;
}) {
  const { m: all } = useMessages();
  const m = all.reviews;
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<ReviewStatus>(REVIEW_STATUSES[0]);
  const [body, setBody] = useState("");
  const [typedNickname, setTypedNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nickname = user ? user.nickname : typedNickname;

  const submit = async () => {
    setError(null);
    if (rating === 0) return setError("review_rating");
    const input = { certId, rating, body, status, nickname };
    const checked = checkReview(input);
    if ("error" in checked) return setError(checked.error);

    setBusy(true);
    const result = await sendReview(checked.data);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    onSaved(result.review);
  };

  return (
    <form
      className="space-y-4 rounded-lg border-2 border-line bg-surface p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset>
        <legend className="font-bold">{m.rating}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              className={`btn min-h-12 px-3 ${rating === n ? "btn-primary" : ""}`}
              onClick={() => setRating(n)}
            >
              ★ {fmt(m.ratingValue, { n })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-bold">{m.status}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {REVIEW_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              className={`btn min-h-12 px-3 ${status === s ? "btn-primary" : ""}`}
              onClick={() => setStatus(s)}
            >
              {m.statuses[s]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-body" className="block font-bold">
          {m.body}
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={REVIEW_BODY_MAX}
          className={inputClass}
        />
        <p className="text-right text-[0.85rem] font-bold text-ink-sub">
          {fmt(m.bodyCount, { n: textLength(body.trim()), max: REVIEW_BODY_MAX })}
        </p>
      </div>

      <div>
        <label htmlFor="review-nickname" className="block font-bold">
          {m.nickname}
        </label>
        <input
          id="review-nickname"
          type="text"
          value={nickname}
          readOnly={!!user}
          onChange={(e) => setTypedNickname(e.target.value)}
          maxLength={REVIEW_NICKNAME_MAX}
          autoComplete="nickname"
          className={`${inputClass} h-12`}
        />
        {user && <p className="mt-1 text-[0.85rem] text-ink-sub">{m.nicknameAuto}</p>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-bad bg-bad-soft p-2 font-bold">
          {errorText(all, error)}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {m.submit}
        </button>
        <button type="button" className="btn" onClick={onClose}>
          {all.common.cancel}
        </button>
      </div>
    </form>
  );
}
