import { site } from "@/content";
import { isAdmin } from "@/lib/auth";
import { listAnswers } from "@/lib/answers";
import { listInvites } from "@/lib/invites";
import { inviteStatus, linkAnswers, peopleComing, SIDES, slovakDay, toCsv } from "@/lib/records";
import { formatStamp } from "@/components/admin/format";

const STATUS = { coming: "príde", declined: "nepríde", waiting: "čaká sa" } as const;

/** CSV downloads for Excel or Sheets: answers, invites, people, kitchen. Signed-in only, never cached. */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isAdmin())) return new Response("Prihláste sa.", { status: 401 });
  const { kind } = await params;
  const [a, i] = await Promise.all([listAnswers(), listInvites()]);
  if (!a.ok || !i.ok) return new Response("Údaje sa nepodarilo načítať.", { status: 503 });
  const answers = a.data;
  const invites = i.data;
  const linked = linkAnswers(answers, invites);
  const household = (id: string) => invites.find((x) => x.id === linked.inviteOf.get(id))?.household ?? "";

  let rows: (string | number)[][];
  switch (kind) {
    case "odpovede":
      rows = [
        ["Meno", "Príde", "Počet hostí", "Z toho detí", "Mená hostí", "Strava a alergie", "Odkaz", "Pozvánka", "Prijaté", "Zdroj"],
        ...answers.map((x) => [
          x.name,
          x.attending ? "áno" : "nie",
          x.attending ? x.guests : 0,
          x.kids.filter(Boolean).length,
          x.party.join(", "),
          x.dietary,
          x.message,
          household(x.id),
          formatStamp(x.submittedAt),
          x.source === "admin" ? "ručne" : "web",
        ]),
      ];
      break;
    case "pozvani":
      rows = [
        ["Domácnosť", "Mená", "Pozvaných", "Strana", "Skupina", "Stav", "Prídu", "Kontakt", "Poznámka", "Pripomenuté"],
        ...invites.map((x) => {
          const st = inviteStatus(linked.answersOf.get(x.id));
          return [
            x.household,
            x.members.join(", "),
            x.expected,
            SIDES[x.side],
            x.group,
            STATUS[st.status],
            st.coming,
            x.contact,
            x.note,
            x.remindedAt ? formatStamp(x.remindedAt) : "",
          ];
        }),
      ];
      break;
    case "hostia":
      rows = [
        ["Meno", "Vek", "Domácnosť", "Strana", "Skupina", "Strava domácnosti"],
        ...peopleComing(answers, invites, linked).map((p) => [
          p.name,
          p.kid ? "dieťa" : "dospelý",
          p.household,
          p.side ? SIDES[p.side] : "",
          p.group,
          p.dietary,
        ]),
      ];
      break;
    case "kuchyna":
      rows = [
        ["Domácnosť", "Ľudí", "Z toho detí", "Strava a alergie"],
        ...answers
          .filter((x) => x.attending && x.dietary.trim() !== "")
          .map((x) => [x.name, x.guests, x.kids.filter(Boolean).length, x.dietary]),
      ];
      break;
    default:
      return new Response("Neznámy export.", { status: 404 });
  }

  const file = `svadba-${site.date}-${kind}-${slovakDay(new Date())}.csv`;
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
