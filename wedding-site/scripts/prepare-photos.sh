#!/bin/sh
# Converts the chosen originals (HEIC/JPG in ../Photos) into web JPEGs in
# src/assets/photos. Next.js then serves AVIF/WebP sizes from these.
# Metadata (including GPS) is stripped by a PNG round-trip, then checked.
set -eu
cd "$(dirname "$0")/.."
SRC=../Photos
OUT=src/assets/photos
TMP=$(mktemp -d)
mkdir -p "$OUT"
convert() { # $1 source file, $2 output name
  sips -s format png -Z 2000 "$SRC/$1" --out "$TMP/$2.png" >/dev/null
  sips -s format jpeg -s formatOptions 82 "$TMP/$2.png" --out "$OUT/$2.jpg" >/dev/null
  if sips -g all "$OUT/$2.jpg" | grep -qi gps; then echo "GPS data left in $2" >&2; exit 1; fi
  echo "$OUT/$2.jpg"
}
convert IMG_4884.JPG autumn-selfie
convert IMG_0376.heic shoes-and-ring
convert IMG_9388.HEIC flower-garden
rm -rf "$TMP"
