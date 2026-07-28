import type { Prisma, PrismaClient } from "@prisma/client";

import { ArticleRepository } from "@/lib/db/article-repository";
import { evaluateQa, type QaResult } from "@/lib/validation/qa";
import { transitionArticle } from "@/server/publishing/article-state";
import type { CourseImport } from "@/types/article";

export const requiredHumanChecks = ["content", "mapping", "audio"] as const;
export type HumanChecks = Record<(typeof requiredHumanChecks)[number], boolean>;

function asCourse(article: NonNullable<Awaited<ReturnType<ArticleRepository["getById"]>>>): CourseImport {
  return { article: { id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh || undefined, topic: article.topic, difficulty: article.difficulty, status: article.status, publishedAt: article.publishedAt || undefined, scheduledAt: article.scheduledAt || undefined }, paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, order: paragraph.order, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text, translationZh: sentence.translationZh || undefined })) })), lessonSegments: article.lessonSegments.map((segment) => ({ id: segment.id, order: segment.order, type: segment.type, voiceRole: segment.voiceRole, sentenceIds: Array.isArray(segment.sentenceIds) ? segment.sentenceIds.filter((value): value is string => typeof value === "string") : [], script: segment.script || undefined, primaryGoal: segment.primaryGoal || undefined })), annotations: article.paragraphs.flatMap((paragraph) => paragraph.sentences.flatMap((sentence) => sentence.annotations.map((annotation) => ({ id: annotation.id, sentenceId: annotation.sentenceId, startOffset: annotation.startOffset, endOffset: annotation.endOffset, text: annotation.text, meaningZh: annotation.meaningZh, noteZh: annotation.noteZh || undefined, exampleEn: annotation.exampleEn || undefined })))) };
}

export async function evaluateArticleQa(db: PrismaClient, articleId: string, humanChecks: HumanChecks) {
  const article = await new ArticleRepository(db).getById(articleId);
  if (!article) throw new Error("Article not found");
  const result = evaluateQa({ course: asCourse(article), audioStatuses: article.lessonSegments.map((segment) => segment.audioStatus) });
  const humanComplete = requiredHumanChecks.every((check) => humanChecks[check] === true);
  const passed = result.blockingIssues.length === 0 && humanComplete;
  const qa = await db.articleQa.upsert({ where: { articleId }, create: { articleId, automated: result as Prisma.InputJsonValue, humanChecks: humanChecks as Prisma.InputJsonValue, passedAt: passed ? new Date() : null }, update: { automated: result as Prisma.InputJsonValue, humanChecks: humanChecks as Prisma.InputJsonValue, passedAt: passed ? new Date() : null } });
  if (passed && article.status === "AUDIO_READY") await db.article.update({ where: { id: articleId }, data: { status: transitionArticle(article.status, "QA_PASSED") } });
  return { ...qa, result, humanComplete, passed };
}

export async function assertPublishReady(db: PrismaClient, articleId: string) {
  const qa = await db.articleQa.findUnique({ where: { articleId } });
  if (!qa?.passedAt) throw new Error("QA has not passed");
}
