"use client";

import { useState } from "react";
import { login, signup } from "@/lib/auth-client";
import { LOCK_MINUTES, signupSchema } from "@/lib/auth-rules";
import { fmt, type Messages } from "@/lib/i18n";
import { useMessages } from "@/lib/use-messages";

/** 오류 코드 → 화면 문구 (모르는 코드는 일반 안내 문구) */
export function errorText(m: Messages, code: string): string {
  const errors: Record<string, string> = m.errors;
  return fmt(errors[code] ?? errors.unknown, { minutes: LOCK_MINUTES });
}

type Mode = "login" | "signup";

const inputClass =
  "mt-1 block h-14 w-full rounded-lg border-2 border-line bg-surface px-4 text-lg text-ink placeholder:text-ink-sub";

/** 로그인 / 회원가입 (아이디·비밀번호·닉네임만 받는다) */
export function AuthForm() {
  const { m: all } = useMessages();
  const m = all.auth;
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (mode === "signup") {
      const parsed = signupSchema.safeParse({ username, password, nickname });
      if (!parsed.success) return setError(parsed.error.issues[0].message);
      if (password !== passwordAgain) return setError("password_mismatch");
    } else if (!username.trim() || !password) {
      return setError("credentials_required");
    }
    setBusy(true);
    const code =
      mode === "login" ? await login(username, password) : await signup(username, password, nickname);
    setBusy(false);
    if (code) setError(code);
  };

  return (
    <div className="mx-auto max-w-md">
      <div role="tablist" aria-label={m.tabs} className="grid grid-cols-2 gap-2">
        {(["login", "signup"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={mode === tab}
            onClick={() => {
              setMode(tab);
              setError(null);
            }}
            className={`min-h-14 rounded-lg border-2 text-lg font-extrabold ${
              mode === tab
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            {m[tab]}
          </button>
        ))}
      </div>

      <form
        className="card mt-3 space-y-4 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <label htmlFor="auth-username" className="font-bold">
            {m.username}
          </label>
          <input
            id="auth-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            className={inputClass}
          />
          {mode === "signup" && <p className="mt-1 text-[0.8rem] text-ink-sub">{all.errors.username_rule}</p>}
        </div>

        <div>
          <label htmlFor="auth-password" className="font-bold">
            {m.password}
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass}
          />
          {mode === "signup" && <p className="mt-1 text-[0.8rem] text-ink-sub">{all.errors.password_rule}</p>}
        </div>

        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="auth-password-again" className="font-bold">
                {m.passwordAgain}
              </label>
              <input
                id="auth-password-again"
                type="password"
                value={passwordAgain}
                onChange={(e) => setPasswordAgain(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="auth-nickname" className="font-bold">
                {m.nickname}
              </label>
              <input
                id="auth-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="nickname"
                className={inputClass}
              />
              <p className="mt-1 text-[0.8rem] text-ink-sub">{all.errors.nickname_rule}</p>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-bad bg-bad-soft p-3 font-bold">
            {errorText(all, error)}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy ? m.busy : mode === "login" ? m.login : m.join}
        </button>

        {mode === "signup" && <p className="text-[0.8rem] text-ink-sub">{m.noRecovery}</p>}
      </form>
    </div>
  );
}
