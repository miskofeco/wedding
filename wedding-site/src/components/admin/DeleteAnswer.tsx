"use client";

import { useActionState, useState } from "react";
import { removeAnswer } from "@/app/admin/actions";
import { initialAdminState } from "@/lib/admin";

export function DeleteAnswer({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(removeAnswer, initialAdminState);

  if (!confirming) {
    return (
      <button type="button" className="link-btn" onClick={() => setConfirming(true)}>
        Vymazať<span className="sr-only"> odpoveď {name}</span>
      </button>
    );
  }
  return (
    <form action={action} className="admin-confirm">
      <input type="hidden" name="id" value={id} />
      <span>Naozaj vymazať?</span>
      <button type="submit" className="link-btn link-btn--danger" disabled={pending}>
        {pending ? "Mažem…" : "Áno, vymazať"}
      </button>
      <button type="button" className="link-btn" onClick={() => setConfirming(false)} disabled={pending}>
        Nie
      </button>
      {state.status === "error" && (
        <span className="field__error" role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}
