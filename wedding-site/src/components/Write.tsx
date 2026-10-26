import type { CSSProperties } from "react";

type Mode = "title" | "line" | "prose";

interface WriteProps {
  /** The text, as shown (run it through `tie` first where Slovak line breaks matter). */
  text: string;
  /** „title“ headings, names and captions · „line“ dates, times and kickers · „prose“ paragraphs. Sets the length of the sweep. */
  mode?: Mode;
  /** When this text starts, in ms after the reveal, to follow a previous `Write` (see `writeTime`). */
  start?: number;
}

/**
 * How long the sweep takes: a base plus a little per letter, held between a floor and a ceiling. The edge always
 * runs several times faster than a guest reads (about 20 letters a second), so nobody waits on it.
 */
const TIME: Record<Mode, { base: number; per: number; min: number; max: number }> = {
  title: { base: 240, per: 16, min: 360, max: 620 },
  line: { base: 180, per: 10, min: 280, max: 460 },
  prose: { base: 320, per: 2.8, min: 420, max: 820 },
};

/** How long `Write` takes to ink `text`, to chain the next one with `start`. */
export function writeTime(text: string, mode: Mode = "title"): number {
  const t = TIME[mode];
  return Math.round(Math.min(t.max, Math.max(t.min, t.base + t.per * [...text].length)));
}

const ms = (v: number) => `${Math.round(v)}ms`;

/**
 * Text that is inked in once its reveal fires (motion.css, „hand-made layer“): one soft edge runs along it in the
 * direction of reading, line after line, like the brush on a button and the ink on a drawing. The text stays one
 * plain run, so kerning, ligatures, selection and screen readers are untouched. Without motion (no JavaScript,
 * reduced motion, ?static) it simply sits in place.
 *
 * --t when it starts, --wd how long the sweep takes.
 */
export function Write({ text, mode = "title", start = 0 }: WriteProps) {
  const style = { "--t": ms(start), "--wd": ms(writeTime(text, mode)) } as CSSProperties;
  return (
    <span className={`write write--${mode}`} style={style}>
      {text}
    </span>
  );
}

/** „Barbora & Michal“: the first name, the second as the first is nearly down, and the ampersand last as the flourish. */
export function Names({ first, second }: { first: string; second: string }) {
  const secondAt = Math.round(writeTime(first) * 0.7);
  const ampAt = secondAt + Math.round(writeTime(second) * 0.7);
  return (
    <>
      <Write text={first} />{" "}
      <span className="amp">
        <Write text="&" start={ampAt} />
      </span>{" "}
      <Write text={second} start={secondAt} />
    </>
  );
}
