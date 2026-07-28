import type { Prisma, PrismaClient } from "@prisma/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { evaluateQa, type QaResult } from "@/lib/validation/qa";
import { transitionArticle } from "@/server/publishing/article-state";
import type { CourseImport } from "@/types/article";

export const requiredHumanChecks = ["content", "mapping", "audio"] as const;
export type HumanChecks = Record<(typeof requiredHumanChecks)[number], boolean>;

function asCourse(article: NonNullable<Awaited<ReturnType<ArticleRepository["getById"]>>>): CourseImport {
  return { article: { id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh || undefined, topic: article.topic, difficulty: article.difficulty, status: article.status, publishedAt: article.publishedAt || undefined, scheduledAt: article.scheduledAt || undefined }, paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, order: paragraph.order, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text, translationZh: sentence.translationZh || undefined })) })), paragraphGuides: article.paragraphGuides.map((guide) => ({ id: guide.id, paragraphId: guide.paragraphId, order: guide.order, paragraphGoal: guide.paragraphGoal, openingBridge: guide.openingBridge || undefined, paragraphWrap: guide.paragraphWrap || undefined, nextParagraphBridge: guide.nextParagraphBridge || undefined, scriptText: guide.scriptText, audioPath: guide.audioPath || undefined, audioDurationMs: guide.audioDurationMs || undefined, audioStatus: guide.audioStatus, textHash: guide.textHash || undefined, sentenceGuides: guide.sentenceGuides.map((sentence) => ({ id: sentence.id, paragraphId: sentence.paragraphId, sentenceId: sentence.sentenceId, order: sentence.order, depth: sentence.depth, originalReadText: sentence.originalReadText, meaningZh: sentence.meaningZh, sentenceFunction: sentence.sentenceFunction, primaryTeachingGoal: sentence.primaryTeachingGoal, focusScript: sentence.focusScript || undefined, bridgeScript: sentence.bridgeScript || undefined, likelyMisunderstanding: sentence.likelyMisunderstanding || undefined, expressionTarget: sentence.expressionTarget || undefined, replayAfterExplanation: sentence.replayAfterExplanation, estimatedStartMs: sentence.estimatedStartMs || undefined, estimatedEndMs: sentence.estimatedEndMs || undefined })) })), annotations: article.paragraphs.flatMap((paragraph) => paragraph.sentences.flatMap((sentence) => sentence.annotations.map((annotation) => ({ id: annotation.id, sentenceId: annotation.sentenceId, startOffset: annotation.startOffset, endOffset: annotation.endOffset, text: annotation.text, meaningZh: annotation.meaningZh, noteZh: annotation.noteZh || undefined, exampleEn: annotation.exampleEn || undefined })))) };
}

export async function evaluateArticleQa(db: PrismaClient, articleId: string, humanChecks: HumanChecks) {
  const article = await new ArticleRepository(db).getById(articleId); if (!article) throw new Error("Article not found");
  const result = evaluateQa({ course: asCourse(article), audioStatuses: article.paragraphGuides.map((guide) => guide.audioStatus) });
  const humanComplete = requiredHumanChecks.every((check) => humanChecks[check] === true); const passed = result.blockingIssues.length === 0 && humanComplete;
  const qa = await db.articleQa.upsert({ where: { articleId }, create: { articleId, automated: result as Prisma.InputJsonValue, humanChecks: humanChecks as Prisma.InputJsonValue, passedAt: passed ? new Date() : null }, update: { automated: result as Prisma.InputJsonValue, humanChecks: humanChecks as Prisma.InputJsonValue, passedAt: passed ? new Date() : null } });
  if (passed && article.status === "AUDIO_READY") await db.article.update({ where: { id: articleId }, data: { status: transitionArticle(article.status, "QA_PASSED") } });
  return { ...qa, result, humanComplete, passed };
}

export async function assertPublishReady(db: PrismaClient, articleId: string) { const qa = await db.articleQa.findUnique({ where: { articleId } }); if (!qa?.passedAt) throw new Error("QA has not passed"); }
