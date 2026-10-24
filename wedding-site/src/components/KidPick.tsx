"use client";

import { useId, useState } from "react";

/** Adult / child choice for one guest. Without JavaScript the radios still post `kid-N`. */
export function KidPick({
  field,
  value,
  onChange,
  guest,
}: {
  /** The radio group name, `kid-2` … `kid-10`. */
  field: `kid-${number}`;
  value: boolean;
  onChange: (kid: boolean) => void;
  /** Name of the guest, for the screen-reader label. */
  guest: string;
}) {
  return (
    <div className="kidpick" role="radiogroup" aria-label={`${guest}: dospelý alebo dieťa`}>
      <label className="kidpick__opt">
        <input type="radio" name={field} value="adult" checked={!value} onChange={() => onChange(false)} />
        <span>Dospelý</span>
      </label>
      <label className="kidpick__opt">
        <input type="radio" name={field} value="kid" checked={value} onChange={() => onChange(true)} />
        <span>Dieťa</span>
      </label>
    </div>
  );
}

/** Small „i“ button with a tooltip: opens on hover, focus or tap, closes on Escape or when focus leaves. */
export function InfoTip({ label, children }: { label: string; children: React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="infotip"
      data-open={open || undefined}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button type="button" className="infotip__btn" aria-label={label} aria-describedby={id} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden="true">i</span>
      </button>
      <span className="infotip__bubble" role="tooltip" id={id}>
        {children}
      </span>
    </span>
  );
}
