import { execFileSync, spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";

const databaseUrl = process.env.E2E_DATABASE_URL ?? "file:../data/xreader.e2e.db";
if (!databaseUrl.startsWith("file:../data/")) throw new Error("E2E_DATABASE_URL must use file:../data/<name>.db");

const databasePath = path.resolve(process.cwd(), "data", databaseUrl.slice("file:../data/".length));
if (existsSync(databasePath)) rmSync(databasePath);

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const environment = { ...process.env, DATABASE_URL: databaseUrl };
execFileSync(command, ["run", "db:migrate"], { cwd: process.cwd(), stdio: "inherit", env: environment });
execFileSync(command, ["run", "course:import", "--", "why-rain-has-a-smell"], { cwd: process.cwd(), stdio: "inherit", env: environment });
execFileSync(command, ["run", "course:import", "--", "multi-sentence-fixture", "tests/fixtures/courses"], { cwd: process.cwd(), stdio: "inherit", env: environment });

const server = spawn(command, ["run", "dev", "--", "--port", "3201"], { cwd: process.cwd(), stdio: "inherit", env: environment });
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => server.kill(signal));
server.once("exit", (code) => { process.exitCode = code ?? 1; });
