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

  it("persists stable sentence IDs and ordered segments", async () => {
    const article = await repository.createCourse(seedCourse);
    const loaded = await repository.getBySlug(article.slug);

    expect(loaded?.paragraphs[0].sentences[0].id).toBe("seed-rain-p01-s01");
    expect(loaded?.paragraphs).toHaveLength(6);
    expect(loaded?.paragraphs.flatMap((paragraph) => paragraph.sentences)).toHaveLength(24);
    expect(loaded?.lessonSegments.map((segment) => segment.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });
});
