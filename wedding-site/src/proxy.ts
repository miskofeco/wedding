import { NextResponse, type NextRequest } from "next/server";
import { comingSoon } from "@/content/launch";
import { bootScript } from "@/lib/boot";
import { adminCsp } from "@/lib/csp";

// Until the invitation opens, production answers every guest page with „Pripravujeme“
// (content/launch.ts). Local dev and preview deploys keep the full site.
const showComingSoon = comingSoon && process.env.VERCEL_ENV === "production";

// /admin shows text guests typed, so it gets a strict policy: only scripts
// carrying this request's nonce (Next.js adds it to its own) and the boot
// script, by hash. The guest pages are static, so they get the baseline policy
// from next.config.ts instead.
let bootHash: Promise<string> | null = null;
const hashBoot = async () => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bootScript));
  return `sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    return showComingSoon ? NextResponse.rewrite(new URL("/pripravujeme", request.url)) : NextResponse.next();
  }

  const nonce = btoa(crypto.randomUUID());
  const policy = adminCsp(nonce, await (bootHash ??= hashBoot()), process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/admin/:path*",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    // Guest pages, for the „Pripravujeme“ gate. Not the page itself, the calendar file it links,
    // Next.js assets, drawings, masks or the icon.
    "/((?!admin(?:/|$)|pripravujeme|svadba\\.ics|_next/|art/|fills/|icon\\.svg).*)",
  ],
};
