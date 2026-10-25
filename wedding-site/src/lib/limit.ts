// Fixed-window counters kept in memory. Best effort only: every server
// instance counts on its own and forgets on restart, so the Vercel Firewall
// rules in the README are the real limit. Server-only.

interface Slot {
  count: number;
  since: number;
}

export interface Limiter {
  /** True once `key` has used up its window. */
  blocked(key: string): boolean;
  /** Counts one attempt for `key`. */
  hit(key: string): void;
  clear(key: string): void;
}

export function createLimiter(max: number, windowMs: number): Limiter {
  const windows = new Map<string, Slot>();
  const live = (key: string, now: number) => {
    const w = windows.get(key);
    if (w && now - w.since <= windowMs) return w;
    if (w) windows.delete(key);
    return null;
  };
  // Drop finished windows now and then, so the map can't grow without bound.
  const prune = (now: number) => {
    if (windows.size < 1000) return;
    for (const [key, w] of windows) if (now - w.since > windowMs) windows.delete(key);
  };
  return {
    blocked(key) {
      return (live(key, Date.now())?.count ?? 0) >= max;
    },
    hit(key) {
      const now = Date.now();
      const w = live(key, now);
      if (w) w.count += 1;
      else {
        prune(now);
        windows.set(key, { count: 1, since: now });
      }
    },
    clear(key) {
      windows.delete(key);
    },
  };
}

/** The visitor's IP. On Vercel the platform sets these headers; a client can't override them. */
export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
