import Image from "next/image";
import type { CSSProperties } from "react";

interface DrawingProps {
  src: string;
  /** Empty for decoration (the default). */
  alt?: string;
  className?: string;
  /** For reveal delays (`--d`). */
  style?: CSSProperties;
  /** The page's main above-the-fold drawing: eager, high priority and preloaded. */
  priority?: boolean;
  /** Other above-the-fold drawings: eager, without jumping the queue. */
  eager?: boolean;
}

/** A line drawing from public/art. SVGs are served as-is (1080 × 1080 artboard). */
export function Drawing({ src, alt = "", className, style, priority = false, eager = false }: DrawingProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1080}
      height={1080}
      unoptimized
      className={className}
      style={style}
      loading={priority || eager ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
    />
  );
}
