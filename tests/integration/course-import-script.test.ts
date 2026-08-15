import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const options = { cwd: process.cwd(), stdio: "pipe" as const, env: process.env };

describe("course import command", () => {
  it("imports two courses whose source articles both begin at p01-s01", async () => {
    execFileSync(command, ["run", "course:import", "--", "why-rain-has-a-smell"], options);
    execFileSync(command, ["run", "course:import", "--", "multi-sentence-fixture", "tests/fixtures/courses"], options);

    await expect(prisma.article.findMany({
      where: { slug: { in: ["why-rain-has-a-smell", "multi-sentence-fixture"] } },
      include: { paragraphs: { include: { sentences: true } } },
      orderBy: { slug: "asc" },
    })).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ slug: "why-rain-has-a-smell" }),
      expect.objectContaining({ slug: "multi-sentence-fixture" }),
    ]));
  });
});
