import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { app } from "electron";
import path from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const isDev = process.env.NODE_ENV === "development";

const dbPath = isDev
  ? path.join(process.cwd(), "data", "dev.db")
  : path.join(app.getPath("userData"), "nextech.db");

const sqlite = new Database(dbPath);

sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export function runMigrations() {
  const migrationsFolder = path.join(__dirname, "migrations");
  migrate(db, {
    migrationsFolder,
  });
}

export { sqlite };