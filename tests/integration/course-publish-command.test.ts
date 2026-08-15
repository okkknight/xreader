import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const options = { cwd: process.cwd(), stdio: "pipe" as const, env: process.env };

describe("course publish command", () => {
  it("prints an exact READY MP3 release plan without mutating the remote host", () => {
    execFileSync(command, ["run", "course:import", "--", "why-rain-has-a-smell"], options);
    const result = spawnSync(command, ["run", "course:publish", "--", "why-rain-has-a-smell", "--dry-run"], options);

    expect(result.status).toBe(0);
    const output = result.stdout.toString();
    const plan = JSON.parse(output.slice(output.indexOf("{"))) as { slug: string; audioPaths: string[]; databasePath: string; dryRun: boolean };
    expect(plan).toMatchObject({ slug: "why-rain-has-a-smell", dryRun: true });
    expect(plan.databasePath).toMatch(/test\.db$/);
    expect(plan.audioPaths).toHaveLength(42);
    expect(plan.audioPaths.every((audioPath) => audioPath.endsWith("/audio.mp3"))).toBe(true);
  });
});
