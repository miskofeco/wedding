import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content";
import { requireAdmin } from "@/lib/auth";
import { listAnswers, sheetConfigured } from "@/lib/sheet";
import { logout } from "./actions";
import { AnswersBoard } from "@/components/admin/AnswersBoard";

export const metadata: Metadata = { title: `Odpovede · ${site.couple.mark}` };

export default async function AdminPage() {
  await requireAdmin();
  const configured = sheetConfigured();
  const result = configured ? await listAnswers() : null;
  const sheetUrl = process.env.RSVP_SHEET_VIEW_URL?.startsWith("https://") ? process.env.RSVP_SHEET_VIEW_URL : null;

  return (
    <>
      <header className="admin-bar">
        <div className="wrap admin-bar__inner">
          <Link className="admin-mark" href="/">
            {site.couple.mark}
          </Link>
          <div className="admin-bar__actions">
            {sheetUrl && (
              <a className="btn admin-btn" href={sheetUrl} target="_blank" rel="noopener noreferrer">
                <span className="only-wide">Otvoriť tabuľku</span>
                <span className="only-narrow">Tabuľka</span>
                <span className="sr-only"> (otvorí sa v novom okne)</span>
              </a>
            )}
            <form action={logout}>
              <button className="btn admin-btn" type="submit" style={{ "--c": "var(--white)" } as CSSProperties}>
                Odhlásiť sa
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="obsah" className="admin">
        <div className="wrap">
          <h1 className="admin__title">Odpovede hostí</h1>
          {!configured && (
            <div className="notice" role="status">
              <p>
                <strong>Tabuľka nie je pripojená.</strong> Nastavte <code>RSVP_SHEET_URL</code> a <code>RSVP_SHEET_SECRET</code> podľa
                návodu v <code>google-sheet/SETUP.md</code>.
              </p>
            </div>
          )}
          {result && !result.ok && (
            <div className="notice" role="alert">
              <p>
                <strong>Odpovede sa nepodarilo načítať.</strong>{" "}
                {result.error === "unreachable" ? "Tabuľka neodpovedá." : "Tabuľka požiadavku odmietla."}{" "}
                <Link href="/admin">Skúsiť znova</Link>
              </p>
            </div>
          )}
          {result?.ok && <AnswersBoard answers={result.data} />}
        </div>
      </main>
    </>
  );
}
