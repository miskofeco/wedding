import type { NextConfig } from "next";
import { comingSoon } from "./src/content/launch";
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

// Until the invitation opens, production answers every guest page with „Pripravujeme“
// (content/launch.ts). Decided when the site is built: `npm run deploy` builds with the
// production settings from `vercel pull`, which include VERCEL_ENV. Local builds and
// preview deploys keep the full site.
const showComingSoon = comingSoon && process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Down from 1 MB, so junk uploads cost less. The largest real bodies are a content
    // save (the action takes up to 100,000 characters of JSON, ~200 kB of Slovak text)
    // and a 300-line invitation paste (~100 kB); tests/authz.e2e.ts sends both.
    serverActions: { bodySizeLimit: "256kb" },
  },
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
  async rewrites() {
    // Before the pages, so it wins over them. Not the page itself, the calendar file it
    // links, /admin, Next.js assets, drawings, masks or the icon.
    const gate = { source: "/((?!admin(?:/|$)|pripravujeme|svadba\\.ics|_next/|art/|fills/|icon\\.svg).*)", destination: "/pripravujeme" };
    return { beforeFiles: showComingSoon ? [gate] : [], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
