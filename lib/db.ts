import Database from "better-sqlite3";
import { join } from "path";

let db: Database.Database | null = null;

/** Singleton SQLite connection (dev-server-safe: reused across hot reloads). */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(join(process.cwd(), "data", "classfit.db"), { readonly: true, fileMustExist: true });
  }
  return db;
}
