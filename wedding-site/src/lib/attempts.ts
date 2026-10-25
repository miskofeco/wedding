// Login tries per address, counted in the database so every server instance
// shares one count and a restart doesn't reset it (the counters in limit.ts
// can't do either). Rows are keyed by a SHA-256 of the IP, so no address is
// stored, and are dropped once their window is over. Server-only.
import { createHash } from "node:crypto";
import { db } from "./db";

export interface AttemptLimiter {
  /** Counts one try for `ip`; false once the window's tries are used up. */
  attempt(ip: string): Promise<boolean>;
  clear(ip: string): Promise<void>;
}

const keyOf = (ip: string) => createHash("sha256").update(ip, "utf8").digest("hex");

export function createAttemptLimiter(max: number, windowMs: number, now: () => number = Date.now): AttemptLimiter {
  return {
    async attempt(ip) {
      const t = now();
      // One transaction: drop finished windows (this key's too), then count, so parallel tries can't slip past.
      const [, counted] = await (await db()).batch(
        [
          { sql: "DELETE FROM login_attempts WHERE since < ?", args: [t - windowMs] },
          {
            sql: `INSERT INTO login_attempts (key, count, since) VALUES (?, 1, ?)
                  ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count`,
            args: [keyOf(ip), t],
          },
        ],
        "write",
      );
      return Number(counted.rows[0]?.count ?? 0) <= max;
    },
    async clear(ip) {
      await (await db()).execute({ sql: "DELETE FROM login_attempts WHERE key = ?", args: [keyOf(ip)] });
    },
  };
}
