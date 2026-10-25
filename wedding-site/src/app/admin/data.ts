// Everything the admin pages read, loaded once per request. Server-only.
import { cache } from "react";
import { listAnswers } from "@/lib/answers";
import { dbConfigured } from "@/lib/db";
import { listInvites } from "@/lib/invites";
import { linkAnswers, summarize, type Invite, type StoredAnswer } from "@/lib/records";
import { sheetConfigured } from "@/lib/sheet";

export interface Board {
  answers: StoredAnswer[];
  invites: Invite[];
  /** Answer id → invite id. */
  inviteOf: Record<string, string>;
  /** Answer id → how it was linked. */
  linkedBy: Record<string, "manual" | "name">;
  summary: ReturnType<typeof summarize>;
  db: "ok" | "not_configured" | "failed";
  sheet: { configured: boolean; pending: number; url: string | null };
}

export const loadBoard = cache(async (): Promise<Board> => {
  const [a, i] = await Promise.all([listAnswers(), listInvites()]);
  const answers = a.ok ? a.data : [];
  const invites = i.ok ? i.data : [];
  const linked = linkAnswers(answers, invites);
  const viewUrl = process.env.RSVP_SHEET_VIEW_URL ?? "";
  return {
    answers,
    invites,
    inviteOf: Object.fromEntries(linked.inviteOf),
    linkedBy: Object.fromEntries(linked.how),
    summary: summarize(answers, invites, linked),
    db: !dbConfigured() ? "not_configured" : a.ok && i.ok ? "ok" : "failed",
    sheet: {
      configured: sheetConfigured(),
      pending: answers.filter((x) => x.sheetPending).length + invites.filter((x) => x.sheetPending).length,
      url: viewUrl.startsWith("https://") ? viewUrl : null,
    },
  };
});
