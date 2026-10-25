import Image from "next/image";

interface DrawingProps {
  src: string;
  /** Empty for decoration (the default). */
  alt?: string;
  className?: string;
  /** The page's main above-the-fold drawing: eager, high priority and preloaded. */
  priority?: boolean;
  /** Other above-the-fold drawings: eager, without jumping the queue. */
  eager?: boolean;
}

/** A line drawing from public/art. SVGs are served as-is (1080 × 1080 artboard). */
export function Drawing({ src, alt = "", className, priority = false, eager = false }: DrawingProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1080}
      height={1080}
      unoptimized
      className={className}
      loading={priority || eager ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
    />
  );
}
