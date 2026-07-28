import type { PrismaClient } from "@prisma/client";

import { ArticleRepository } from "@/lib/db/article-repository";
import { validateCourse } from "@/lib/validation/course-schema";
import type { CourseImport } from "@/types/article";

export type ArticleDraftInput = CourseImport;

export async function saveArticleDraft(db: PrismaClient, input: ArticleDraftInput) {
  const course = validateCourse(input);
  const repository = new ArticleRepository(db);
  const existing = await repository.getById(course.article.id);
  if (!existing) return repository.createCourse(course);

  const bodyText = course.paragraphs.map((paragraph) => paragraph.text).join("\n\n");
  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  await db.$transaction(async (transaction) => {
    await transaction.annotation.deleteMany({ where: { sentence: { paragraph: { articleId: course.article.id } } } });
    await transaction.paragraph.deleteMany({ where: { articleId: course.article.id } });
    await transaction.lessonSegment.deleteMany({ where: { articleId: course.article.id } });
    await transaction.article.update({ where: { id: course.article.id }, data: {
      slug: course.article.slug, titleEn: course.article.titleEn, titleZh: course.article.titleZh, dekZh: course.article.dekZh,
      topic: course.article.topic, difficulty: course.article.difficulty, status: course.article.status, publishedAt: course.article.publishedAt,
      scheduledAt: course.article.scheduledAt, bodyText, wordCount,
      paragraphs: { create: course.paragraphs.map((paragraph) => ({ id: paragraph.id, order: paragraph.order, text: paragraph.text, sentences: { create: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text, translationZh: sentence.translationZh })) } })) },
      lessonSegments: { create: course.lessonSegments.map((segment) => ({ id: segment.id, order: segment.order, type: segment.type, voiceRole: segment.voiceRole, sentenceIds: segment.sentenceIds, script: segment.script, primaryGoal: segment.primaryGoal })) },
    } });
    if (course.annotations.length) await transaction.annotation.createMany({ data: course.annotations });
  });
  return repository.getById(course.article.id).then((article) => {
    if (!article) throw new Error("article disappeared while saving");
    return article;
  });
}
