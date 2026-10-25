import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/content";
import { requireAdmin } from "@/lib/auth";
import { readContent } from "@/lib/content";
import { dbConfigured } from "@/lib/db";
import { DetailsEditor, FaqEditor, ProgrammeEditor, RequestsEditor } from "@/components/admin/ContentEditors";
import { Notice, PageHead } from "@/components/admin/PageHead";

const parts = {
  program: { label: "Program", sub: "Chvíle dňa v poradí, ako idú za sebou. Cesta na webe vedie cez ne." },
  prosby: { label: "Pár prosieb", sub: "Prosby na hostí v poradí dňa, medzi miestami a mapou." },
  otazky: { label: "Časté otázky", sub: "Otázky a odpovede v sekcii „Časté otázky“." },
  udaje: { label: "Termín a časy", sub: "Termín odpovedí, kontakt a časy na paneloch miest." },
} as const;
type Part = keyof typeof parts;
const isPart = (p: string): p is Part => p in parts;

export async function generateMetadata({ params }: { params: Promise<{ part: string }> }): Promise<Metadata> {
  const { part } = await params;
  return { title: isPart(part) ? `${parts[part].label} · Obsah webu` : "Obsah webu" };
}

/** Editors for the parts of the guest site the couple changes themselves. */
export default async function ContentPage({ params }: { params: Promise<{ part: string }> }) {
  await requireAdmin(); // see loadBoard
  const { part } = await params;
  if (!isPart(part)) notFound();
  const { content, updatedAt } = await readContent();

  return (
    <main className="adm-page adm-page--narrow">
      <PageHead title="Obsah webu" sub={parts[part].sub} />
      <nav className="adm-tabs" aria-label="Časti webu">
        {(Object.keys(parts) as Part[]).map((p) => (
          <Link key={p} href={`/admin/obsah/${p}`} aria-current={p === part ? "page" : undefined}>
            {parts[p].label}
          </Link>
        ))}
      </nav>
      {!dbConfigured() && (
        <Notice>
          <strong>Databáza nie je pripojená,</strong> úpravy sa nedajú uložiť. Web zatiaľ ukazuje obsah zo súborov.
        </Notice>
      )}
      {part === "program" && <ProgrammeEditor initial={content.programme} updatedAt={updatedAt.programme} />}
      {part === "prosby" && <RequestsEditor initial={content.requests} updatedAt={updatedAt.requests} />}
      {part === "otazky" && <FaqEditor initial={content.faq} updatedAt={updatedAt.faq} />}
      {part === "udaje" && <DetailsEditor initial={content.details} updatedAt={updatedAt.details} weddingDay={site.date} />}
    </main>
  );
}
