import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { prisma } from "@/lib/db/client";
import { buildCourseReleasePlan } from "@/lib/release/course-release-plan";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const slug = args.find((argument) => !argument.startsWith("--"));
if (!slug) throw new Error("Usage: npm run course:publish -- <slug> --dry-run | --host <user@host> --remote-root <path>");
const courseSlug = slug;

function option(name: string) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function run(command: string, commandArgs: string[], input?: string) {
  const result = spawnSync(command, commandArgs, { stdio: input === undefined ? "inherit" : ["pipe", "inherit", "inherit"], input });
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${result.status}`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:../data/xreader.db";
  const audioRoot = process.env.AUDIO_STORAGE_DIR ?? "data/audio";
  const plan = await buildCourseReleasePlan(prisma, { slug: courseSlug, databaseUrl, audioRoot });
  const dryRun = args.includes("--dry-run");
  if (dryRun) {
    console.log(JSON.stringify({ ...plan, dryRun: true }, null, 2));
    return;
  }

  const host = option("--host");
  const remoteRoot = option("--remote-root");
  if (!host || !remoteRoot) throw new Error("Remote publication requires --host <user@host> and --remote-root <path>");
  if (!path.isAbsolute(remoteRoot)) throw new Error("--remote-root must be an absolute remote path");

  const releaseName = `${plan.slug}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const remoteStage = `${remoteRoot}/.releases/${releaseName}`;
  run("ssh", [host, `set -eu; mkdir -p '${remoteStage}/audio'`]);
  run("rsync", ["-a", plan.databasePath, `${host}:${remoteStage}/xreader.db`]);
  run("rsync", ["-a", "--files-from=-", `${plan.audioRoot}/`, `${host}:${remoteStage}/audio/`], `${plan.audioPaths.join("\n")}\n`);
  run("ssh", [host, `set -eu; test -f '${remoteStage}/xreader.db'; rsync -a '${remoteStage}/audio/' '${remoteRoot}/data/audio/'; mv '${remoteStage}/xreader.db' '${remoteRoot}/data/xreader.db'; systemctl restart xreader.service`]);
  console.log(JSON.stringify({ ...plan, dryRun: false, remoteStage }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
