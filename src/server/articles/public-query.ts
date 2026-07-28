import type { PrismaClient } from "@prisma/client";

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
  return db.article.findFirst({ where: { slug, ...visibility(now) }, include: publicInclude });
}

export async function getTodayArticle(db: PrismaClient, now = new Date()) {
  return db.article.findFirst({
    where: visibility(now), include: publicInclude,
    orderBy: [{ publishedAt: "desc" }, { scheduledAt: "desc" }],
  });
}
