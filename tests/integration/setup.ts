import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

export async function setup() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:../data/test.db";
  const databasePath = path.resolve(import.meta.dirname, "../../prisma", databaseUrl.replace(/^file:/, ""));

  if (existsSync(databasePath)) rmSync(databasePath);
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "scripts/migrate.ts"], {
    cwd: path.resolve(import.meta.dirname, "../.."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  });
}
