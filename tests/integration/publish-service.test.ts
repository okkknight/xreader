import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import { publishArticle, withdrawArticle } from "@/server/publishing/publish-service";

async function createArticle(audioStatus: "READY" | "MISSING") {
  const id = randomUUID();
  return prisma.article.create({ data: {
    id, slug: `publish-${id}`, titleEn: "Title", titleZh: "标题", topic: "test", difficulty: "B1-B2",
    bodyText: "A body.", wordCount: 2, status: "QA_PASSED",
    lessonSegments: { create: { id: `segment-${id}`, order: 1, type: "OPENING", voiceRole: "TEACHER", script: "Hello", sentenceIds: [], audioStatus, audioPath: audioStatus === "READY" ? "article/segment/audio.wav" : null } },
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
