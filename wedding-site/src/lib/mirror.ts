// Copies every row waiting for the Google Sheet. Runs after each write (via
// `after`) and from the „Synchronizovať“ button in /admin. Server-only.
import { mirrorAnswer, pendingAnswerIds } from "./answers";
import { mirrorInvite, pendingInviteIds } from "./invites";

let running: Promise<{ done: number; left: number }> | null = null;

export function syncPending(): Promise<{ done: number; left: number }> {
  // One pass at a time per server instance; a second caller waits for the same pass.
  running ??= (async () => {
    let done = 0;
    let left = 0;
    try {
      // One by one: the script holds a lock per request anyway.
      for (const id of await pendingAnswerIds()) {
        if (await mirrorAnswer(id)) done++;
        else left++;
      }
      for (const id of await pendingInviteIds()) {
        if (await mirrorInvite(id)) done++;
        else left++;
      }
    } catch (err) {
      console.error(`Sheet sync failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
    return { done, left };
  })().finally(() => {
    running = null;
  });
  return running;
}
