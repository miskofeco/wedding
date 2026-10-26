import { NextResponse, type NextRequest } from "next/server";
import { bootScript } from "@/lib/boot";
import { adminCsp } from "@/lib/csp";
import { testSiteAuthorized } from "@/lib/test-site-auth";

// /admin shows text guests typed, so it gets a strict policy: only scripts
// carrying this request's nonce (Next.js adds it to its own) and the boot
// script, by hash. Guest pages get the baseline policy from next.config.ts.
// The test project's password gate runs before every page, action and asset,
// including on its generated vercel.app URLs. It never trusts the Host header.
let bootHash: Promise<string> | null = null;
const hashBoot = async () => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(bootScript));
  return `sha256-${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
};

export async function proxy(request: NextRequest) {
  const testSite = process.env.SITE_VARIANT === "test";
  if (testSite) {
    const password = process.env.TEST_SITE_PASSWORD || "";
    const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow, noarchive" };
    if (password.length < 16) return new NextResponse("Test site password is not configured.", { status: 503, headers });
    if (!testSiteAuthorized(request.headers.get("authorization"), password)) {
      return new NextResponse("Enter the test site password to continue.", {
        status: 401,
        headers: { ...headers, "WWW-Authenticate": 'Basic realm="Baska a Misko - test", charset="UTF-8"' },
      });
    }
  }

  const isAdmin = request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/");
  if (!isAdmin) {
    const response = NextResponse.next();
    if (testSite) {
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    return response;
  }

  const nonce = btoa(crypto.randomUUID());
  const policy = adminCsp(nonce, await (bootHash ??= hashBoot()), process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  if (testSite) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return response;
}

export const config = {
  matcher: "/:path*",
};
