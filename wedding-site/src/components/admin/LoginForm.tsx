"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import type { LoginState } from "@/lib/admin";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="adm-form">
      <div className="adm-field">
        <label htmlFor="password">Heslo</label>
        <input
          className="adm-input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
        {state.error && (
          <p className="adm-field__error" id="login-error" role="alert">
            {state.error}
          </p>
        )}
      </div>
      <button className="adm-btn adm-btn--primary" type="submit" disabled={pending}>
        {pending ? "Overujem…" : "Prihlásiť sa"}
      </button>
    </form>
  );
}
