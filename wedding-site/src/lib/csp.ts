// Content Security Policies. Styles stay 'unsafe-inline': the pages set custom
// properties in style attributes, which a nonce can't cover. In development
// React needs eval for its error overlay.

const common = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

/**
 * Guest pages: prerendered, so there is no per-request nonce, and Next.js puts
 * the page data in inline scripts. 'unsafe-inline' scripts are acceptable here
 * because these pages show no text anyone else typed.
 */
export function publicCsp(dev: boolean): string {
  return [...common, `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`].join("; ");
}

/** /admin: rendered per request, so only scripts with this nonce, and the boot script by its hash. */
export function adminCsp(nonce: string, bootHash: string, dev: boolean): string {
  return [...common, `script-src 'nonce-${nonce}' '${bootHash}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`].join("; ");
}
