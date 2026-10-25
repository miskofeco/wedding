"use client";

import { Icon } from "./Icon";

export function PrintButton({ label = "Tlačiť" }: { label?: string }) {
  return (
    <button type="button" className="adm-btn" onClick={() => window.print()}>
      <Icon name="print" />
      {label}
    </button>
  );
}
