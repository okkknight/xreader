import { execFileSync } from "node:child_process";
import { mkdirSync, openSync, closeSync } from "node:fs";
import path from "node:path";

const configuredUrl = process.env.DATABASE_URL ?? "file:../data/xreader.db";
if (!configuredUrl.startsWith("file:")) throw new Error("DATABASE_URL must use a local SQLite file: URL");
const databaseUrl = configuredUrl.startsWith("file:../data/")
  ? `file:${path.resolve(process.cwd(), "data", configuredUrl.slice("file:../data/".length))}`
  : configuredUrl;
const databasePath = databaseUrl.slice("file:".length);
mkdirSync(path.dirname(databasePath), { recursive: true });
closeSync(openSync(databasePath, "a"));

execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: databaseUrl },
});
