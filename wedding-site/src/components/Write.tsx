import { Fragment, type CSSProperties, type ReactNode } from "react";

type Mode = "pen" | "type" | "prose";

interface WriteProps {
  /** The text, as shown (run it through `tie` first where Slovak line breaks matter). */
  text: string;
  /**
   * „pen“ draws each letter behind a moving nib (headings); „type“ presses each letter in behind a caret
   * (dates, times, kickers); „prose“ lets a paragraph flow on, letters soft-landing in the direction of reading.
   */
  mode?: Mode;
  /** Average milliseconds per letter (defaults per mode). */
  pace?: number;
  /** Longest the whole text may take, in milliseconds; a longer text is typed faster (defaults per mode). */
  budget?: number;
  /** When this text starts, in ms after the reveal, to follow a previous `Write` (see `writeTime`). */
  start?: number;
  /** The caret stays after the last letter and blinks three times. */
  caret?: boolean;
}

const PACE: Record<Mode, number> = { pen: 44, type: 36, prose: 8 };
const BUDGET: Record<Mode, number> = { pen: 700, type: 520, prose: 850 };
/** How long the caret lingers after the last letter. */
const LINGER = 140;

/** A fixed pseudo-random number in [0, 1) for a letter, so server and browser agree. */
const wobble = (i: number, code: number) => {
  const x = Math.sin(i * 12.9898 + code * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * When each letter lands, like a hand at work: an uneven pace, a breath between words, a longer pause
 * after a comma or a full stop. Spaces take no time of their own. Scaled down if the whole would take
 * longer than the budget.
 */
function rhythm(chars: string[], pace: number, budget: number) {
  const times: number[] = [];
  let t = 0;
  chars.forEach((ch, i) => {
    times.push(t);
    if (ch === " ") return;
    let gap = pace * (0.7 + 0.6 * wobble(i, ch.codePointAt(0) ?? 0));
    const next = chars[i + 1];
    if (next === " ") gap += pace * 0.6;
    if (/[,;:]/.test(ch)) gap += Math.max(50, pace * 3);
    if (/[.!?→·]/.test(ch) && next !== undefined) gap += Math.max(90, pace * 4);
    if (next !== undefined) t += gap;
  });
  const end = t;
  const k = end > budget ? budget / end : 1;
  return { times: times.map((v) => v * k), end: end * k, pace: pace * k };
}

/** How long `Write` takes to set `text` (until its last letter starts), to chain the next one with `start`. */
export function writeTime(text: string, mode: Mode = "pen", pace?: number, budget?: number): number {
  return Math.round(rhythm([...text], pace ?? PACE[mode], budget ?? BUDGET[mode]).end);
}

const ms = (v: number) => `${Math.round(v)}ms`;

/**
 * Text that is written or typed in live once its reveal fires (motion.css, „hand-made layer“): letters land
 * one by one at a hand's pace, behind a nib (pen), a caret (type) or a soft leading edge (prose). Screen readers get one plain copy
 * and the split letters are hidden from them. Words never break inside, and a no-break space from `tie`
 * keeps two words together. Without motion (no JavaScript, reduced motion, ?static) the letters simply sit
 * in place.
 *
 * Per letter: --t when it starts, --w how long its wipe (and the nib) takes, --h how long the caret then
 * waits after it, until the next letter starts.
 */
export function Write({ text, mode = "pen", pace, budget, start = 0, caret = false }: WriteProps) {
  const chars = [...text];
  const r = rhythm(chars, pace ?? PACE[mode], budget ?? BUDGET[mode]);
  // A letter's wipe never runs past the next letter's start, so only one nib is ever on the line.
  const wipe = mode === "pen" ? r.pace * 1.5 : 1;
  const last = chars.length - 1;

  const words: ReactNode[][] = [[]];
  chars.forEach((ch, k) => {
    if (ch === " ") {
      words.push([]);
      return;
    }
    const nextLetter = chars.findIndex((c, j) => j > k && c !== " ");
    const dt = Math.max(16, nextLetter === -1 ? LINGER : r.times[nextLetter] - r.times[k]);
    const w = Math.min(dt, wipe);
    // the caret leaves a few ms early, so two never show at once
    const style = { "--t": ms(start + r.times[k]), "--w": ms(w), "--h": ms(Math.max(0, dt - w - 4)) } as CSSProperties;
    words[words.length - 1].push(
      <span key={k} className={k === last ? "ch ch--end" : "ch"} style={style}>
        {ch}
      </span>,
    );
  });

  return (
    <span className={`write write--${mode}`} data-caret={caret ? "" : undefined}>
      <span className="sr-only">{text}</span>
      <span className="write__ink" aria-hidden="true">
        {words.map((letters, w) => (
          <Fragment key={w}>
            {w > 0 && " "}
            <span className="write__word">{letters}</span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}

/** „Barbora & Michal“ written by hand: the first name, the second, and the ampersand last as the flourish. */
export function Names({ first, second, pace = 44 }: { first: string; second: string; pace?: number }) {
  // each word waits for the caret of the one before to leave
  const secondAt = writeTime(first, "pen", pace) + LINGER + pace;
  const ampAt = secondAt + writeTime(second, "pen", pace) + LINGER + pace;
  return (
    <>
      <Write text={first} pace={pace} />{" "}
      <span className="amp">
        <Write text="&" pace={pace} start={ampAt} />
      </span>{" "}
      <Write text={second} pace={pace} start={secondAt} />
    </>
  );
}
