import { drawings } from "./art.generated";

export type DrawingName = keyof typeof drawings;
export type InkFor<N extends DrawingName> = (typeof drawings)[N][number];

/** Public URL of a generated drawing. Only name/ink pairs listed in art-manifest.json type-check. */
export function art<N extends DrawingName>(name: N, ink: InkFor<N>): string {
  return `/art/${ink}/${name}.svg`;
}
