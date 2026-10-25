"use client";

import { useState, useTransition } from "react";
import { syncSheet } from "@/app/admin/actions";
import { Icon } from "./Icon";

/** The Google Sheet's state in the sidebar, with a button that copies waiting rows now. */
export function SyncButton({ configured, pending, url }: { configured: boolean; pending: number; url: string | null }) {
  const [busy, start] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  if (!configured) {
    return (
      <p className="adm-sync adm-sync--off">
        <Icon name="sheet" />
        <span>Tabuľka Google nie je pripojená</span>
      </p>
    );
  }
  return (
    <div className="adm-sync">
      <p className="adm-sync__state">
        <Icon name="sheet" />
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer">
            Tabuľka Google<span className="sr-only"> (otvorí sa v novom okne)</span>
          </a>
        ) : (
          <span>Tabuľka Google</span>
        )}
        <span className={pending ? "adm-dot adm-dot--waiting" : "adm-dot adm-dot--ok"} />
        <span className="sr-only">{pending ? `${pending} zmien čaká` : "aktuálna"}</span>
      </p>
      {pending > 0 && (
        <button
          type="button"
          className="adm-sync__btn"
          disabled={busy}
          onClick={() =>
            start(async () => {
              const r = await syncSheet();
              setNote(r.left ? `${r.left} sa nepodarilo, skúste neskôr` : "Hotovo");
            })
          }
        >
          <Icon name="sync" className={busy ? "adm-spin" : undefined} />
          {busy ? "Synchronizujem…" : `Synchronizovať (${pending})`}
        </button>
      )}
      {note && (
        <p className="adm-sync__note" role="status">
          {note}
        </p>
      )}
    </div>
  );
}
