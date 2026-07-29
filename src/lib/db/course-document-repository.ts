import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

import { courseDocumentSchema } from "@/lib/course-blocks/schema";
import type { CourseDocument } from "@/lib/course-blocks/types";

type ImportInput = {
  articleId: string;
  sourceMarkdown: string;
  finalLectureMarkdown: string;
  sourceHash?: string;
  finalLectureHash?: string;
  course: CourseDocument;
  parseReport?: Prisma.InputJsonValue;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export class CourseDocumentRepository {
  constructor(private readonly db: PrismaClient) {}

  async importBuiltCourse(input: ImportInput) {
    const course = courseDocumentSchema.parse(input.course);
    const report = input.parseReport as { needsReview?: unknown[] } | undefined;
    if (report?.needsReview && report.needsReview.length > 0) {
      throw new Error("Course document has unresolved needsReview items");
    }

    return this.db.$transaction(async (transaction) => {
      const saved = await transaction.courseDocument.upsert({
        where: { articleId: input.articleId },
        create: {
          articleId: input.articleId,
          schemaVersion: course.schemaVersion,
          sourceMarkdown: input.sourceMarkdown,
          finalLectureMarkdown: input.finalLectureMarkdown,
          sourceHash: input.sourceHash ?? sha256(input.sourceMarkdown),
          finalLectureHash: input.finalLectureHash ?? sha256(input.finalLectureMarkdown),
          courseJson: course as unknown as Prisma.InputJsonValue,
          parseReport: input.parseReport,
          status: "IMPORTED",
          audio: { create: course.audio.map((audio) => ({ audioId: audio.audioId, blockIds: audio.blockIds, path: audio.path, durationMs: audio.durationMs, status: audio.status.toUpperCase() as "READY" | "MISSING" | "FAILED", scriptHash: audio.scriptHash })) },
        },
        update: {
          schemaVersion: course.schemaVersion,
          sourceMarkdown: input.sourceMarkdown,
          finalLectureMarkdown: input.finalLectureMarkdown,
          sourceHash: input.sourceHash ?? sha256(input.sourceMarkdown),
          finalLectureHash: input.finalLectureHash ?? sha256(input.finalLectureMarkdown),
          courseJson: course as unknown as Prisma.InputJsonValue,
          parseReport: input.parseReport,
          status: "IMPORTED",
          audio: { deleteMany: {}, create: course.audio.map((audio) => ({ audioId: audio.audioId, blockIds: audio.blockIds, path: audio.path, durationMs: audio.durationMs, status: audio.status.toUpperCase() as "READY" | "MISSING" | "FAILED", scriptHash: audio.scriptHash })) },
        },
        include: { audio: true },
      });
      return saved;
    });
  }
}
