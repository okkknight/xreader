import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/client";
import { CourseDocumentRepository } from "@/lib/db/course-document-repository";
import type { CourseDocument } from "@/lib/course-blocks/types";

const document: CourseDocument = {
  schemaVersion: 1,
  slug: "rain",
  title: "Rain",
  sourceHash: "source",
  finalLectureHash: "final",
  blocks: [{ id: "block-001", type: "intro", segments: [{ language: "zh", role: "teaching", text: "引子" }] }],
  audio: [{ audioId: "audio-001", blockIds: ["block-001"], path: "rain/audio.wav", durationMs: 1000, status: "ready", scriptHash: "script" }],
};

describe("CourseDocumentRepository", () => {
  it("imports a built Course Block document and its audio mapping", async () => {
    const articleId = randomUUID();
    await prisma.article.create({ data: { id: articleId, slug: `course-document-${articleId}`, titleEn: "Rain", titleZh: "雨", topic: "test", bodyText: "Rain.", wordCount: 1, paragraphs: { create: { id: `p-${articleId}`, order: 1, text: "Rain.", sentences: { create: { id: `s-${articleId}`, order: 1, text: "Rain." } } } } } });
    const saved = await new CourseDocumentRepository(prisma).importBuiltCourse({ articleId, sourceMarkdown: "# Rain\n\nRain.", finalLectureMarkdown: "引子", sourceHash: "source", finalLectureHash: "final", course: document });
    expect(saved.courseJson).toEqual(document);
    expect(saved.audio).toHaveLength(1);
    expect(saved.status).toBe("IMPORTED");
  });

  it("rejects a document marked with unresolved review issues", async () => {
    await expect(new CourseDocumentRepository(prisma).importBuiltCourse({ articleId: randomUUID(), sourceMarkdown: "", finalLectureMarkdown: "", sourceHash: "source", finalLectureHash: "final", course: document, parseReport: { needsReview: [{ at: 1 }] } })).rejects.toThrow(/needsReview/);
  });
});
