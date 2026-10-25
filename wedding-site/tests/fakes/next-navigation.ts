// Stands in for `next/navigation` in the tests (hooks.mjs). redirect() throws,
// as the real one does, so code after it never runs.
export function redirect(url: string): never {
  throw Object.assign(new Error(`redirect to ${url}`), { redirectTo: url });
}
