import type { Metadata } from "next";
import { AnswersTable } from "@/components/admin/AnswersTable";
import { plural } from "@/components/admin/format";
import { Notice, PageHead } from "@/components/admin/PageHead";
import { loadBoard } from "../../data";

export const metadata: Metadata = { title: "Odpovede" };

export default async function AnswersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const board = await loadBoard();
  const q = await searchParams;
  const id = typeof q.id === "string" ? q.id : null;
  const s = board.summary;
  return (
    <main className="adm-page">
      <PageHead
        title="Odpovede"
        sub={`${s.households} ${plural(s.households, ["domácnosť príde", "domácnosti prídu", "domácností príde"])} (${s.guests} ${plural(s.guests, ["človek", "ľudia", "ľudí"])}) · ${s.declinedHouseholds} nepríde`}
      />
      {board.db !== "ok" && (
        <Notice>
          <strong>Odpovede sa nepodarilo načítať.</strong> {board.db === "not_configured" ? "Databáza nie je pripojená." : "Skúste obnoviť stránku."}
        </Notice>
      )}
      <AnswersTable
        answers={board.answers}
        invites={board.invites}
        inviteOf={board.inviteOf}
        linkedBy={board.linkedBy}
        initialOpen={q.nova === "1" ? "new" : id}
      />
    </main>
  );
}
