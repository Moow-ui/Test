"use client";

import { useState } from "react";
import { login, signup } from "@/lib/auth-client";
import { NICKNAME_RULE, PASSWORD_RULE, USERNAME_RULE, signupSchema } from "@/lib/auth-rules";

type Mode = "login" | "signup";

const inputClass =
  "mt-1 block h-14 w-full rounded-lg border-2 border-line bg-surface px-4 text-lg text-ink placeholder:text-ink-sub";

/** 로그인 / 회원가입 (아이디·비밀번호·닉네임만 받는다) */
export function AuthForm() {
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
      if (password !== passwordAgain) return setError("비밀번호 확인이 비밀번호와 다릅니다.");
    } else if (!username.trim() || !password) {
      return setError("아이디와 비밀번호를 입력해 주세요.");
    }
    setBusy(true);
    const message =
      mode === "login" ? await login(username, password) : await signup(username, password, nickname);
    setBusy(false);
    if (message) setError(message);
  };

  return (
    <div className="mx-auto max-w-md">
      <div role="tablist" aria-label="로그인 또는 회원가입" className="grid grid-cols-2 gap-2">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`min-h-14 rounded-lg border-2 text-lg font-extrabold ${
              mode === m
                ? "border-primary bg-primary text-white"
                : "border-line bg-surface text-ink hover:border-ink"
            }`}
          >
            {m === "login" ? "로그인" : "회원가입"}
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
            아이디
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
          {mode === "signup" && <p className="mt-1 text-[0.8rem] text-ink-sub">{USERNAME_RULE}</p>}
        </div>

        <div>
          <label htmlFor="auth-password" className="font-bold">
            비밀번호
          </label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass}
          />
          {mode === "signup" && <p className="mt-1 text-[0.8rem] text-ink-sub">{PASSWORD_RULE}</p>}
        </div>

        {mode === "signup" && (
          <>
            <div>
              <label htmlFor="auth-password-again" className="font-bold">
                비밀번호 확인
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
                닉네임
              </label>
              <input
                id="auth-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="nickname"
                className={inputClass}
              />
              <p className="mt-1 text-[0.8rem] text-ink-sub">{NICKNAME_RULE}</p>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-bad bg-bad-soft p-3 font-bold">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
          {busy ? "잠시만요…" : mode === "login" ? "로그인" : "가입하기"}
        </button>

        {mode === "signup" && (
          <p className="text-[0.8rem] text-ink-sub">
            이메일·전화번호는 받지 않습니다. 그래서 비밀번호를 잊으면 찾을 수 없으니 꼭 기억해 두세요.
          </p>
        )}
      </form>
    </div>
  );
}
