"use client";

import { useActionState, useState } from "react";
import { Icon } from "./Icon";

type State = { status: string; message?: string; at: number };

/** A delete that asks once, inline: „Vymazať“ → „Naozaj?“ with yes / no. */
export function ConfirmDelete({
  id,
  what,
  action,
  initial,
  onDone,
}: {
  id: string;
  /** What is deleted, for the question and screen readers, e.g. „odpoveď Jana Nováková“. */
  what: string;
  /** A method signature, so actions with a narrower state type fit. */
  action(prev: State, form: FormData): Promise<State>;
  initial: State;
  onDone: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, run, pending] = useActionState(async (prev: State, form: FormData) => {
    const r = await action(prev, form);
    if (r.status === "saved") onDone();
    return r;
  }, initial);

  if (!confirming) {
    return (
      <button type="button" className="adm-btn adm-btn--danger-quiet" onClick={() => setConfirming(true)}>
        <Icon name="trash" />
        Vymazať<span className="sr-only"> {what}</span>
      </button>
    );
  }
  return (
    <form action={run} className="adm-confirm" role="group" aria-label={`Vymazať ${what}`}>
      <input type="hidden" name="id" value={id} />
      <span>Naozaj vymazať {what}?</span>
      <button type="submit" className="adm-btn adm-btn--danger" disabled={pending}>
        {pending ? "Mažem…" : "Áno, vymazať"}
      </button>
      <button type="button" className="adm-btn" onClick={() => setConfirming(false)} disabled={pending}>
        Nie
      </button>
      {state.status === "error" && (
        <span className="adm-field__error" role="alert">
          {state.message}
        </span>
      )}
    </form>
  );
}
