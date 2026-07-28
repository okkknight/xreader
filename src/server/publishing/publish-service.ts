import type { PrismaClient } from "@prisma/client";

import { transitionArticle } from "./article-state";

export async function publishArticle(db: PrismaClient, articleId: string, at: Date): Promise<void> {
  const article = await db.article.findUniqueOrThrow({ where: { id: articleId }, include: { paragraphGuides: true } });
  if (article.paragraphGuides.length === 0 || article.paragraphGuides.some((guide) => guide.audioStatus !== "READY" || !guide.audioPath)) {
    throw new Error("missing current audio");
  }
  const status = transitionArticle(article.status, "PUBLISHED");
  await db.article.update({ where: { id: articleId }, data: { status, publishedAt: at, scheduledAt: null } });
}

export async function withdrawArticle(db: PrismaClient, articleId: string): Promise<void> {
  const article = await db.article.findUniqueOrThrow({ where: { id: articleId } });
  await db.article.update({ where: { id: articleId }, data: { status: transitionArticle(article.status, "ARCHIVED") } });
}
