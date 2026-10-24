import type { Photo } from "./types";
import autumnSelfie from "@/assets/photos/autumn-selfie.jpg";
import shoesAndRing from "@/assets/photos/shoes-and-ring.jpg";
import flowerGarden from "@/assets/photos/flower-garden.jpg";

// Regenerate the files with `npm run photos` (strips location metadata).
export const photos: Photo[] = [
  { src: autumnSelfie, alt: "Barbora a Michal, jesenná selfie", caption: null },
  { src: shoesAndRing, alt: "Topánky na lavičke a zásnubný prsteň", caption: null },
  { src: flowerGarden, alt: "Barbora a Michal v kvetinovej záhrade", caption: null },
];
