import type { Prisma, PrismaClient } from "@prisma/client";
import type { PublicArticle } from "@/types/public-article";

const publicInclude = {
  paragraphs: { orderBy: { order: "asc" as const }, include: { sentences: { orderBy: { order: "asc" as const }, include: { annotations: true } } } },
  lessonSegments: { orderBy: { order: "asc" as const } },
};

function visibility(now: Date) {
  return {
    OR: [
      { status: "PUBLISHED" as const, publishedAt: { lte: now } },
      { status: "SCHEDULED" as const, scheduledAt: { lte: now } },
    ],
  };
}

export async function getPublicArticle(db: PrismaClient, slug: string, now = new Date()) {
  const article = await db.article.findFirst({ where: { slug, ...visibility(now) }, include: publicInclude });
  return article ? toPublicArticle(article) : null;
}

export async function getTodayArticle(db: PrismaClient, now = new Date()) {
  const article = await db.article.findFirst({
    where: visibility(now), include: publicInclude,
    orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }],
  });
  return article ? toPublicArticle(article) : null;
}

export async function listPublicArticles(db: PrismaClient, now = new Date()) {
  const articles = await db.article.findMany({ where: visibility(now), include: publicInclude, orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }] });
  return articles.map(toPublicArticle);
}

type PublicArticleQuery = Prisma.ArticleGetPayload<{ include: typeof publicInclude }>;

function toPublicArticle(article: PublicArticleQuery): PublicArticle {
  return {
    id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh, topic: article.topic, difficulty: article.difficulty,
    paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => ({ id: sentence.id, text: sentence.text, translationZh: sentence.translationZh, annotations: sentence.annotations.map((annotation) => ({ id: annotation.id, text: annotation.text, meaningZh: annotation.meaningZh, noteZh: annotation.noteZh, exampleEn: annotation.exampleEn })) })) })),
    lessonSegments: article.lessonSegments.map((segment) => ({ id: segment.id, order: segment.order, type: segment.type, script: segment.script, sentenceIds: Array.isArray(segment.sentenceIds) ? segment.sentenceIds.filter((id): id is string => typeof id === "string") : [], audioPath: segment.audioPath, audioStatus: segment.audioStatus })),
  };
}
