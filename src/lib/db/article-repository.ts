import type { Prisma, PrismaClient } from "@prisma/client";

import type { CourseImport } from "@/types/article";

const articleInclude = {
  paragraphs: {
    orderBy: { order: "asc" },
    include: { sentences: { orderBy: { order: "asc" }, include: { annotations: true } } },
  },
  lessonSegments: { orderBy: { order: "asc" } },
} satisfies Prisma.ArticleInclude;

export type ArticleRecord = Prisma.ArticleGetPayload<{
  include: typeof articleInclude;
}>;

export class ArticleRepository {
  constructor(private readonly db: PrismaClient) {}

  async createCourse(input: CourseImport): Promise<ArticleRecord> {
    const bodyText = input.paragraphs.map((paragraph) => paragraph.text).join("\n\n");
    const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;

    return this.db.$transaction(async (transaction) => {
      await transaction.article.create({
        data: {
        ...input.article,
        bodyText,
        wordCount,
        paragraphs: {
          create: input.paragraphs.map((paragraph) => ({
            id: paragraph.id,
            order: paragraph.order,
            text: paragraph.text,
            sentences: {
              create: paragraph.sentences.map((sentence) => ({
                id: sentence.id,
                order: sentence.order,
                text: sentence.text,
                translationZh: sentence.translationZh,
              })),
            },
          })),
        },
        lessonSegments: {
          create: input.lessonSegments.map((segment) => ({
            id: segment.id,
            order: segment.order,
            type: segment.type,
            voiceRole: segment.voiceRole,
            sentenceIds: segment.sentenceIds,
            script: segment.script,
            primaryGoal: segment.primaryGoal,
          })),
        },
        },
      });

      if (input.annotations.length > 0) {
        await transaction.annotation.createMany({ data: input.annotations });
      }

      return transaction.article.findUniqueOrThrow({
        where: { id: input.article.id },
        include: articleInclude,
      });
    });
  }

  async getBySlug(slug: string): Promise<ArticleRecord | null> {
    return this.db.article.findUnique({ where: { slug }, include: articleInclude });
  }

  async getById(id: string): Promise<ArticleRecord | null> {
    return this.db.article.findUnique({ where: { id }, include: articleInclude });
  }
}
