import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import type { LLMProvider } from "@/lib/ai/provider";
import { JobService } from "@/server/generation/job-service";

const articleInput = () => ({
  id: randomUUID(), slug: `generation-${randomUUID()}`, titleEn: "Before", titleZh: "之前",
  topic: "test", difficulty: "B1-B2", bodyText: "Original body", wordCount: 2,
});

describe("JobService", () => {
  it("keeps the prior promoted article when a replacement generation fails", async () => {
    const article = await prisma.article.create({ data: articleInput() });
    const successfulProvider: LLMProvider = { generateStructured: async () => ({
      titleEn: "After", titleZh: "之后", topic: "test", difficulty: "B1-B2", bodyText: "Promoted body",
    }) };
    const jobs = new JobService(prisma, successfulProvider);
    const successfulJob = await jobs.run(article.id, "ARTICLE_WRITER");
    await jobs.promote(article.id, "ARTICLE_WRITER", successfulJob.id);

    const failingProvider: LLMProvider = { generateStructured: async () => { throw new Error("provider down"); } };
    await expect(new JobService(prisma, failingProvider).run(article.id, "ARTICLE_WRITER")).rejects.toThrow("provider down");
    expect((await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).bodyText).toBe("Promoted body");
  });
});
