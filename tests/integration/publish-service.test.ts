import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import { publishArticle, withdrawArticle } from "@/server/publishing/publish-service";

async function createArticle(audioStatus: "READY" | "MISSING") {
  const id = randomUUID();
  return prisma.article.create({ data: {
    id, slug: `publish-${id}`, titleEn: "Title", titleZh: "标题", topic: "test", difficulty: "B1-B2",
    bodyText: "A body.", wordCount: 2, status: "QA_PASSED",
    paragraphs: { create: { id: `paragraph-${id}`, order: 1, text: "A body.", sentences: { create: { id: `sentence-${id}`, order: 1, text: "A body." } } } },
    paragraphGuides: { create: { id: `guide-${id}`, paragraphId: `paragraph-${id}`, order: 1, paragraphGoal: "Read", scriptText: "Hello", audioStatus, audioPath: audioStatus === "READY" ? "article/guide/audio.wav" : null, sentenceGuides: { create: { id: `sentence-guide-${id}`, paragraphId: `paragraph-${id}`, sentenceId: `sentence-${id}`, order: 1, depth: "QUICK", originalReadText: "A body.", meaningZh: "一段正文", sentenceFunction: "开始", primaryTeachingGoal: "理解" } } } },
  } });
}

describe("publishArticle", () => {
  it("publishes only QA-passed courses with current audio and withdraws them", async () => {
    const article = await createArticle("READY");
    await publishArticle(prisma, article.id, new Date("2026-07-28T00:00:00Z"));
    expect((await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).status).toBe("PUBLISHED");
    await withdrawArticle(prisma, article.id);
    expect((await prisma.article.findUniqueOrThrow({ where: { id: article.id } })).status).toBe("ARCHIVED");
  });

  it("refuses to publish when current audio is missing", async () => {
    const article = await createArticle("MISSING");
    await expect(publishArticle(prisma, article.id, new Date())).rejects.toThrow("missing current audio");
  });
});
