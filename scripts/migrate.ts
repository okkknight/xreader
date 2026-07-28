import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const databaseUrl = process.env.DATABASE_URL ?? "file:../data/xreader.db";

if (!databaseUrl.startsWith("file:")) {
  throw new Error("DATABASE_URL must use a local SQLite file: URL");
}

const rawDatabasePath = databaseUrl.slice("file:".length);
const databasePath = path.isAbsolute(rawDatabasePath)
  ? rawDatabasePath
  : path.resolve(projectRoot, "prisma", rawDatabasePath);
const migrationsDirectory = path.join(projectRoot, "prisma", "migrations");

mkdirSync(path.dirname(databasePath), { recursive: true });

function sqlite(input: string) {
  return execFileSync("sqlite3", [databasePath], {
    encoding: "utf8",
    input,
  });
}

sqlite("CREATE TABLE IF NOT EXISTS _xreader_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL);");

for (const name of readdirSync(migrationsDirectory).sort()) {
  const migrationPath = path.join(migrationsDirectory, name, "migration.sql");
  const applied = sqlite(`SELECT name FROM _xreader_migrations WHERE name = '${name.replaceAll("'", "''")}';`).trim();
  if (applied) continue;

  const migration = readFileSync(migrationPath, "utf8");
  sqlite(`${migration}\nINSERT INTO _xreader_migrations (name, applied_at) VALUES ('${name.replaceAll("'", "''")}', datetime('now'));`);
}
