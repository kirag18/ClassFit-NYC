import { DatabaseSync } from "node:sqlite";
import { join } from "path";

let db: DatabaseSync | null = null;

/**
 * Singleton SQLite connection (dev-server-safe: reused across hot reloads).
 *
 * Uses Node's built-in `node:sqlite` (stable since Node 22.13, no flag needed)
 * instead of better-sqlite3 -- it needs no native compilation, so it can't hit
 * the node-gyp/Python/compiler issues that native modules run into on some
 * hosts. Same `.prepare(sql).all()/.get()` API, so callers are unaffected.
 */
export function getDb(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(join(process.cwd(), "data", "classfit.db"), { readOnly: true });
  }
  return db;
}
