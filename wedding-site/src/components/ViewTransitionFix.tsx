"use client";

import { useEffect } from "react";

const HIDDEN_ABORT = "Transition was aborted because of invalid state";

/**
 * A crossfade cut short because the tab went hidden is skipped quietly by
 * React, but only for the exact message above. Chrome now appends
 * ". Document hidden", so React reports it as an error (the dev overlay, the
 * console in production). This hands React the message it expects. Remove it
 * once React matches the longer text.
 */
export function ViewTransitionFix() {
  useEffect(() => {
    const doc = document;
    const original = doc.startViewTransition;
    if (!original) return;

    doc.startViewTransition = function (arg?: Parameters<Document["startViewTransition"]>[0]) {
      const transition = original.call(doc, arg);
      const ready = transition.ready.catch((error: unknown) => {
        const hiddenAbort =
          error instanceof DOMException && error.name === "InvalidStateError" && error.message.startsWith(HIDDEN_ABORT);
        throw hiddenAbort ? new DOMException(HIDDEN_ABORT, "InvalidStateError") : error;
      });
      Object.defineProperty(transition, "ready", { value: ready });
      return transition;
    };

    return () => {
      doc.startViewTransition = original;
    };
  }, []);

  return null;
}
