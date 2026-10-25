import type { NextConfig } from "next";
import { publicCsp } from "./src/lib/csp";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Drawings and masks keep their names when regenerated, so they can't be cached
// forever: a day fresh, then a week served while the browser checks for a new one.
const assetCache = { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 80],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // /admin gets a stricter, per-request policy from src/proxy.ts.
      {
        source: "/:path((?!admin(?:/|$)).*)",
        headers: [{ key: "Content-Security-Policy", value: publicCsp(process.env.NODE_ENV === "development") }],
      },
      { source: "/art/:path*", headers: [assetCache] },
      { source: "/fills/:path*", headers: [assetCache] },
    ];
  },
};

export default nextConfig;
