"use client";

import { useActionState, useState } from "react";
import { signOutEverywhere } from "@/app/admin/actions";
import { initialAdminState } from "@/lib/admin";
import { Icon } from "./Icon";

/** „Odhlásiť všetky zariadenia“, asked once inline like a delete: every other device signs in again. */
export function SignOutEverywhere() {
  const [confirming, setConfirming] = useState(false);
  const [state, run, pending] = useActionState(async () => {
    const r = await signOutEverywhere();
    if (r.status === "saved") setConfirming(false);
    return r;
  }, initialAdminState);

  return (
    <>
      {confirming ? (
        <form action={run} className="adm-confirm" role="group" aria-label="Odhlásiť všetky zariadenia">
          <span>Odhlásiť všetky ostatné zariadenia?</span>
          <button type="submit" className="adm-btn adm-btn--danger" disabled={pending}>
            {pending ? "Odhlasujem…" : "Áno, odhlásiť"}
          </button>
          <button type="button" className="adm-btn" onClick={() => setConfirming(false)} disabled={pending}>
            Nie
          </button>
        </form>
      ) : (
        <button type="button" className="adm-btn" onClick={() => setConfirming(true)}>
          <Icon name="logout" />
          Odhlásiť všetky zariadenia
        </button>
      )}
      {state.status === "saved" && <p role="status">{state.message}</p>}
      {state.status === "error" && (
        <p className="adm-field__error" role="alert">
          {state.message}
        </p>
      )}
    </>
  );
}
