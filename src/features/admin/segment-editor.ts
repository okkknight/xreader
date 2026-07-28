import type { PrismaClient } from "@prisma/client";

export async function reorderSegments(db: PrismaClient, articleId: string, orderedIds: string[]) {
  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) throw new Error("segment IDs must be unique");

  return db.$transaction(async (transaction) => {
    const current = await transaction.lessonSegment.findMany({ where: { articleId }, orderBy: { order: "asc" } });
    if (current.length !== orderedIds.length || current.some((segment) => !uniqueIds.has(segment.id))) {
      throw new Error("segment order must include every segment exactly once");
    }
    await Promise.all(current.map((segment) => transaction.lessonSegment.update({ where: { id: segment.id }, data: { order: segment.order + 10_000 } })));
    for (const [index, id] of orderedIds.entries()) {
      await transaction.lessonSegment.update({ where: { id }, data: { order: index + 1 } });
    }
    return transaction.lessonSegment.findMany({ where: { articleId }, orderBy: { order: "asc" } });
  });
}
