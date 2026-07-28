import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import type { LLMProvider } from "@/lib/ai/provider";
import { GenerationPipeline } from "@/server/generation/pipeline";

describe("GenerationPipeline", () => {
  it("stores versioned prompt inputs and only promotes after an explicit request", async () => {
    const article = await prisma.article.create({ data: {
      id: randomUUID(), slug: `pipeline-${randomUUID()}`, titleEn: "Before", titleZh: "之前",
      topic: "test", difficulty: "B1-B2", bodyText: "Original body", wordCount: 2,
    } });
    const provider: LLMProvider = { generateStructured: async () => ({
      titleEn: "Generated", titleZh: "生成后", topic: "science", difficulty: "B1-B2", bodyText: "Generated body",
    }) };
    const pipeline = new GenerationPipeline(prisma, provider);

    const job = await pipeline.runPipelineStep(article.id, "ARTICLE_WRITER");
    expect(job.status).toBe("SUCCEEDED");
    expect(job.promptVer).toBe("article-writer/v1");
    expect(job.input).toMatchObject({ prompt_sha256: expect.any(String) });
    expect((await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).bodyText).toBe("Original body");

    await pipeline.promotePipelineOutput(article.id, "ARTICLE_WRITER", job.id);
    expect((await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).bodyText).toBe("Generated body");
  });
});
