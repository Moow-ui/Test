"use client";

import { useEffect, useState } from "react";
import { errorText } from "@/components/auth/AuthForm";
import { fetchPublicCheers, sendCheer } from "@/lib/cheer-client";
import { CHEER_BODY_MAX, CHEER_NICKNAME_MAX, checkCheer, type CheerItem } from "@/lib/cheer-rules";
import { fmt } from "@/lib/i18n";
import { textLength } from "@/lib/review-rules";
import { useMessages } from "@/lib/use-messages";

const inputClass = "mt-2 w-full rounded-lg border-2 border-line bg-surface p-2 text-ink";

/**
 * 받은 응원 (관리자가 공개한 것만, 응원 페이지 상자들 아래).
 * 페이지는 정적 HTML 이라 화면이 열린 뒤 서버에서 받아 그린다. 하나도 없으면 아무것도 그리지 않는다.
 */
export function PublicCheers() {
  const { locale, m: all } = useMessages();
  const m = all.support;
  const [cheers, setCheers] = useState<CheerItem[]>([]);

  useEffect(() => {
    let alive = true;
    void fetchPublicCheers(locale).then((list) => {
      if (alive) setCheers(list);
    });
    return () => {
      alive = false;
    };
  }, [locale]);

  if (cheers.length === 0) return null;
  const date = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <section aria-labelledby="cheers-received" className="space-y-4">
      <h2 id="cheers-received" className="text-xl font-bold">
        {m.receivedTitle}
      </h2>
      <ul className="space-y-2">
        {cheers.map((c) => (
          <li key={c.id} className="card space-y-1 p-4">
            <p className="break-words">{c.body}</p>
            <p className="text-sm font-bold text-ink-sub">
              {c.nickname || m.anonymous} · {date.format(c.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 응원 한마디 쓰기 (응원 페이지 상자 4 안). 보낸 응원은 비공개로 저장되어 바로 목록에 나오지 않는다 */
export function CheerForm() {
  const { locale, m: all } = useMessages();
  const m = all.support;
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    const checked = checkCheer({ locale, body, nickname });
    if ("error" in checked) return setError(checked.error);
    setBusy(true);
    const failure = await sendCheer(checked.data);
    setBusy(false);
    if (failure) return setError(failure);
    setSent(true);
    setBody("");
  };

  return (
    <div className="space-y-4">
      <p>{m.messageIntro}</p>
      {sent ? (
        <div className="space-y-4">
          <p role="status" className="rounded-lg bg-ok-soft p-4 text-lg font-bold">
            {m.sent}
          </p>
          <button type="button" className="btn" onClick={() => setSent(false)}>
            {m.writeAgain}
          </button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div>
            <label htmlFor="cheer-body" className="block font-bold">
              {m.body}
            </label>
            <textarea
              id="cheer-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={CHEER_BODY_MAX}
              className={inputClass}
            />
            <p className="text-right text-sm font-bold text-ink-sub">
              {fmt(m.bodyCount, {
                n: textLength(body.trim()),
                max: CHEER_BODY_MAX,
              })}
            </p>
          </div>
          <div>
            <label htmlFor="cheer-nickname" className="block font-bold">
              {m.nickname}
            </label>
            <input
              id="cheer-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={CHEER_NICKNAME_MAX}
              autoComplete="nickname"
              className={`${inputClass} h-12`}
            />
            <p className="mt-2 text-sm text-ink-sub">{m.nicknameHint}</p>
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
      )}
    </div>
  );
}
