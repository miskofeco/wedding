// Stands in for `next/headers` in the tests (hooks.mjs): the cookies of the
// request being simulated. Tests set and clear `jar` directly.
export const jar = new Map<string, string>();

export async function cookies() {
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (opts: string | { name: string }) => void jar.delete(typeof opts === "string" ? opts : opts.name),
  };
}

export async function headers() {
  return new Headers();
}
