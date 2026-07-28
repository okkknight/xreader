import type { Prisma, PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import type { PublicArticle } from "@/types/public-article";

const publicInclude = {
  paragraphs: { orderBy: { order: "asc" as const }, include: { sentences: { orderBy: { order: "asc" as const }, include: { annotations: true } } } },
  paragraphGuides: { orderBy: { order: "asc" as const }, include: { sentenceGuides: { orderBy: { order: "asc" as const } } } },
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
  return article ? toPublicArticle(db, article) : null;
}

export async function getTodayArticle(db: PrismaClient, now = new Date()) {
  const article = await db.article.findFirst({
    where: visibility(now), include: publicInclude,
    orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }],
  });
  return article ? toPublicArticle(db, article) : null;
}

export async function listPublicArticles(db: PrismaClient, now = new Date()) {
  const articles = await db.article.findMany({ where: visibility(now), include: publicInclude, orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }] });
  return Promise.all(articles.map((article) => toPublicArticle(db, article)));
}

type PublicArticleQuery = Prisma.ArticleGetPayload<{ include: typeof publicInclude }>;

async function toPublicArticle(db: PrismaClient, article: PublicArticleQuery): Promise<PublicArticle> {
  const ownerIds = [...article.paragraphGuides.map((guide) => guide.id), ...article.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => sentence.id))];
  const readyAssets = await db.audioAsset.findMany({ where: { ownerType: { in: ["PARAGRAPH_GUIDE", "SENTENCE"] }, ownerId: { in: ownerIds }, status: "READY" }, orderBy: { createdAt: "desc" } });
  const assetFor = (ownerType: string, ownerId: string, text: string) => {
    const textHash = createHash("sha256").update(text).digest("hex");
    return readyAssets.find((asset) => asset.ownerType === ownerType && asset.ownerId === ownerId && asset.textHash === textHash);
  };
  return {
    id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh, topic: article.topic, difficulty: article.difficulty,
    paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => { const asset = assetFor("SENTENCE", sentence.id, sentence.text); return { id: sentence.id, text: sentence.text, translationZh: sentence.translationZh, annotations: sentence.annotations.map((annotation) => ({ id: annotation.id, text: annotation.text, meaningZh: annotation.meaningZh, noteZh: annotation.noteZh, exampleEn: annotation.exampleEn })), audioPath: asset ? `/api/media/${asset.id}` : null, audioStatus: asset ? "READY" : "MISSING" }; }) })),
    paragraphGuides: article.paragraphGuides.map((guide) => { const asset = assetFor("PARAGRAPH_GUIDE", guide.id, guide.scriptText); return { id: guide.id, paragraphId: guide.paragraphId, order: guide.order, paragraphGoal: guide.paragraphGoal, openingBridge: guide.openingBridge, paragraphWrap: guide.paragraphWrap, nextParagraphBridge: guide.nextParagraphBridge, scriptText: guide.scriptText, sentenceGuides: guide.sentenceGuides.map((sentence) => ({ id: sentence.id, paragraphId: sentence.paragraphId, sentenceId: sentence.sentenceId, order: sentence.order, depth: sentence.depth, originalReadText: sentence.originalReadText, meaningZh: sentence.meaningZh, sentenceFunction: sentence.sentenceFunction, primaryTeachingGoal: sentence.primaryTeachingGoal, focusScript: sentence.focusScript, bridgeScript: sentence.bridgeScript, estimatedStartMs: sentence.estimatedStartMs, estimatedEndMs: sentence.estimatedEndMs })), audioPath: asset ? `/api/media/${asset.id}` : null, audioStatus: asset ? "READY" : guide.audioStatus, audioDurationMs: asset?.durationMs ?? guide.audioDurationMs }; }),
  };
}
