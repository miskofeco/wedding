"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

/**
 * A side panel on a native <dialog>: focus stays inside, Escape and the
 * backdrop close it, and focus returns to the control that opened it.
 */
export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="adm-drawer"
      aria-labelledby="drawer-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="adm-drawer__inner">
          <header className="adm-drawer__head">
            <div>
              <h2 id="drawer-title">{title}</h2>
              {sub && <p className="adm-drawer__sub">{sub}</p>}
            </div>
            <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Zavrieť">
              <Icon name="close" />
            </button>
          </header>
          <div className="adm-drawer__body">{children}</div>
        </div>
      )}
    </dialog>
  );
}
