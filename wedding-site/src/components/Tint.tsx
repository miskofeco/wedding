import type { CSSProperties } from "react";
import type { Colour } from "@/content/types";
import { Drawing } from "./Drawing";

interface TintProps {
  src: string;
  alt?: string;
  /** Large blob. */
  c: Colour;
  /** Small blob. */
  c2: Colour;
  className?: string;
  priority?: boolean;
  eager?: boolean;
  /** Reveal on scroll: the ink stamps, the colour settles under it 120 ms later. Off where a section runs its own sequence (hero). */
  reveal?: boolean;
}

/** A black line drawing coloured from underneath by two soft blobs, like a hand-tinted print. */
export function Tint({ src, alt, c, c2, className, priority, eager, reveal = true }: TintProps) {
  const style = { "--c": `var(--${c})`, "--c2": `var(--${c2})` } as CSSProperties;
  const classes = ["tint", reveal && "rv rv--settle", className].filter(Boolean).join(" ");
  return (
    <span className={classes} style={style}>
      <Drawing src={src} alt={alt} priority={priority} eager={eager} />
    </span>
  );
}
