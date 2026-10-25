import type { Metadata } from "next";
import { site } from "@/content";
import { readContent } from "@/lib/content";
import { InvitesTable } from "@/components/admin/InvitesTable";
import { plural } from "@/components/admin/format";
import { Notice, PageHead } from "@/components/admin/PageHead";
import { loadBoard } from "../../data";

export const metadata: Metadata = { title: "Pozvaní" };

export default async function InvitesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const board = await loadBoard();
  const { content } = await readContent();
  const q = await searchParams;
  const s = board.summary;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return (
    <main className="adm-page">
      <PageHead
        title="Pozvaní"
        sub={
          s.invitedHouseholds
            ? `${s.invitedHouseholds} ${plural(s.invitedHouseholds, ["domácnosť", "domácnosti", "domácností"])} · ${s.invitedPeople} ${plural(s.invitedPeople, ["človek", "ľudia", "ľudí"])} · ${s.waitingHouseholds} bez odpovede`
            : "Kto je pozvaný a kto ešte neodpovedal"
        }
      />
      {s.unlinked > 0 && board.invites.length > 0 && (
        <Notice tone="info">
          {s.unlinked} {plural(s.unlinked, ["odpoveď sa nepodarilo", "odpovede sa nepodarilo", "odpovedí sa nepodarilo"])} priradiť podľa mena.
          Priraďte ich v <a href="/admin/odpovede">Odpovediach</a> (filter „Bez pozvánky“).
        </Notice>
      )}
      <InvitesTable
        invites={board.invites}
        answers={board.answers}
        inviteOf={board.inviteOf}
        initialStatus={q.stav === "caka" ? "waiting" : "all"}
        couple={`${site.couple.first} a ${site.couple.second}`}
        weddingDay={site.date}
        deadline={content.details.deadline}
        siteUrl={siteUrl.startsWith("https://") ? siteUrl : null}
      />
    </main>
  );
}
