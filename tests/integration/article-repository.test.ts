import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { seedCourse } from "../../scripts/seed-course";

const repository = new ArticleRepository(prisma);

describe("ArticleRepository", () => {
  beforeEach(async () => {
    await prisma.article.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists stable sentence IDs and ordered paragraph guides", async () => {
    const article = await repository.createCourse(seedCourse);
    const loaded = await repository.getBySlug(article.slug);

    expect(loaded?.paragraphs[0].sentences[0].id).toBe("seed-rain-p01-s01");
    expect(loaded?.paragraphs).toHaveLength(6);
    expect(loaded?.paragraphs.flatMap((paragraph) => paragraph.sentences)).toHaveLength(24);
    expect(loaded?.paragraphs[0].sentences[1].annotations).toEqual([
      expect.objectContaining({ text: "petrichor", meaningZh: "雨后或初雨时常见的一类气味名称" }),
    ]);
    expect(loaded?.paragraphGuides.map((guide) => guide.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(loaded?.paragraphGuides.flatMap((guide) => guide.sentenceGuides)).toHaveLength(24);
  });
});
