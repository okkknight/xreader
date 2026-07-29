import type { Prisma, PrismaClient } from "@prisma/client";
import { courseDocumentSchema } from "@/lib/course-blocks/schema";
import type { PublicArticle } from "@/types/public-article";

const publicInclude = {
  paragraphs: { orderBy: { order: "asc" as const }, include: { sentences: { orderBy: { order: "asc" as const }, include: { annotations: true } } } },
  courseDocument: { include: { audio: true } },
} satisfies Prisma.ArticleInclude;

function visibility(now: Date) {
  return { OR: [{ status: "PUBLISHED" as const, publishedAt: { lte: now } }, { status: "SCHEDULED" as const, scheduledAt: { lte: now } }] };
}

export async function getPublicArticle(db: PrismaClient, slug: string, now = new Date()) {
  const article = await db.article.findFirst({ where: { slug, ...visibility(now) }, include: publicInclude });
  return article ? toPublicArticle(article) : null;
}

export async function getTodayArticle(db: PrismaClient, now = new Date()) {
  const article = await db.article.findFirst({ where: visibility(now), include: publicInclude, orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }] });
  return article ? toPublicArticle(article) : null;
}

export async function listPublicArticles(db: PrismaClient, now = new Date()) {
  const articles = await db.article.findMany({ where: visibility(now), include: publicInclude, orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }] });
  return articles.map(toPublicArticle);
}

type PublicArticleQuery = Prisma.ArticleGetPayload<{ include: typeof publicInclude }>;
type PersistedCourseAudio = NonNullable<PublicArticleQuery["courseDocument"]>["audio"][number];
const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function toPublicArticle(article: PublicArticleQuery): PublicArticle {
  const course = article.courseDocument ? courseDocumentSchema.parse(article.courseDocument.courseJson) : null;
  const audioById = new Map(article.courseDocument?.audio.map((audio) => [audio.audioId, audio]) ?? []);
  const blockAudio = new Map<string, PersistedCourseAudio>();
  for (const audio of course?.audio ?? []) {
    const persisted = audioById.get(audio.audioId);
    if (!persisted) continue;
    for (const blockId of audio.blockIds) blockAudio.set(blockId, persisted);
  }
  const courseBlocks = (course?.blocks ?? []).map((block) => { const audio = blockAudio.get(block.id); const persisted = audio ? audioById.get(audio.audioId) : undefined; return { ...block, audioPath: persisted ? `${publicBasePath}/api/media/${persisted.id}` : null, audioStatus: persisted?.status ?? "MISSING", audioDurationMs: persisted?.durationMs ?? null }; });
  const sentenceAudio = new Map((course?.audio ?? []).flatMap((audio) => {
    if (!audio.sentenceId) return [];
    const persisted = audioById.get(audio.audioId);
    return persisted ? [[audio.sentenceId, persisted] as const] : [];
  }));
  return {
    id: article.id, slug: article.slug, titleEn: article.titleEn, titleZh: article.titleZh, dekZh: article.dekZh, topic: article.topic, difficulty: article.difficulty,
    paragraphs: article.paragraphs.map((paragraph) => ({ id: paragraph.id, text: paragraph.text, sentences: paragraph.sentences.map((sentence) => { const audio = sentenceAudio.get(sentence.id); return { id: sentence.id, text: sentence.text, translationZh: sentence.translationZh, annotations: sentence.annotations.map((annotation) => ({ id: annotation.id, text: annotation.text, meaningZh: annotation.meaningZh, noteZh: annotation.noteZh, exampleEn: annotation.exampleEn })), audioPath: audio ? `${publicBasePath}/api/media/${audio.id}` : null, audioStatus: audio?.status ?? "MISSING" }; }) })),
    courseBlocks,
  };
}
