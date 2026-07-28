import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { seedCourse } from "../../scripts/seed-course";
import { evaluateArticleQa } from "@/server/qa/article-qa";
import { publishArticle } from "@/server/publishing/publish-service";

describe("admin release workflow", () => {
  it("blocks release until automated and required human QA checks pass", async () => {
    const course = structuredClone(seedCourse);
    course.article.id = "qa-course"; course.article.slug = "qa-course"; course.article.status = "AUDIO_READY";
    course.paragraphs.forEach((paragraph, p) => { paragraph.id = `qa-p${p + 1}`; paragraph.sentences.forEach((sentence, s) => { sentence.id = `qa-p${p + 1}-s${s + 1}`; }); });
    const ids = course.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => sentence.id));
    course.lessonSegments.forEach((segment, index) => { segment.id = `qa-seg-${index + 1}`; segment.sentenceIds = segment.sentenceIds.map((_, index) => ids[index % ids.length]); });
    course.annotations = [];
    await new ArticleRepository(prisma).createCourse(course);
    await prisma.lessonSegment.updateMany({ where: { articleId: course.article.id }, data: { audioStatus: "READY", audioPath: "audio.wav" } });
    await expect(publishArticle(prisma, course.article.id, new Date())).rejects.toThrow("PUBLISHED requires QA_PASSED");
    const qa = await evaluateArticleQa(prisma, course.article.id, { content: true, mapping: true, audio: true });
    expect(qa.passed).toBe(true);
    await expect(publishArticle(prisma, course.article.id, new Date())).resolves.toBeUndefined();
  });
});
