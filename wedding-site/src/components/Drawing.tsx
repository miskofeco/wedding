import Image from "next/image";

interface DrawingProps {
  src: string;
  /** Empty for decoration (the default). */
  alt?: string;
  className?: string;
  /** Above-the-fold drawings load eagerly with high priority. */
  priority?: boolean;
}

/** A line drawing from public/art. SVGs are served as-is (1080 × 1080 artboard). */
export function Drawing({ src, alt = "", className, priority = false }: DrawingProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1080}
      height={1080}
      unoptimized
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
    />
  );
}
