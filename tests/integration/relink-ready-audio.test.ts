import { createHash } from "node:crypto";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { relinkReadyLessonAudio } from "@/server/audio/relink-ready-audio";
import { seedCourse } from "../../scripts/seed-course";

describe("relinkReadyLessonAudio", () => {
  beforeEach(async () => { await prisma.article.deleteMany({ where: { id: "relink-course" } }); });

  it("restores only a READY asset whose text hash matches the rebuilt segment", async () => {
    const course = structuredClone(seedCourse); course.article.id = "relink-course"; course.article.slug = "relink-course";
    course.paragraphs.forEach((paragraph, paragraphIndex) => { paragraph.id = `relink-p${paragraphIndex + 1}`; paragraph.sentences.forEach((sentence, sentenceIndex) => { sentence.id = `relink-p${paragraphIndex + 1}-s${sentenceIndex + 1}`; }); });
    const sentenceIds = course.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => sentence.id));
    course.lessonSegments.forEach((segment, index) => { segment.id = `relink-seg-${index + 1}`; segment.sentenceIds = segment.sentenceIds.map((_, sentenceIndex) => sentenceIds[(index + sentenceIndex) % sentenceIds.length]); });
    course.annotations = [];
    await new ArticleRepository(prisma).createCourse(course);
    const segment = await prisma.lessonSegment.findUniqueOrThrow({ where: { id: "relink-seg-1" } });
    const storageRoot = await mkdtemp(path.join(tmpdir(), "xreader-audio-")); const assetPath = "relink-course/relink-seg-1/audio.wav";
    await mkdir(path.dirname(path.join(storageRoot, assetPath)), { recursive: true });
    await writeFile(path.join(storageRoot, assetPath), "wav");
    await prisma.audioAsset.create({ data: { id: "relink-asset", ownerType: "LESSON_SEGMENT", ownerId: segment.id, provider: "fish", voiceId: "teacher", path: assetPath, format: "wav", durationMs: 1234, textHash: createHash("sha256").update(segment.script!).digest("hex"), status: "READY" } });

    await relinkReadyLessonAudio(prisma, course.article.id, storageRoot);

    await expect(prisma.lessonSegment.findUniqueOrThrow({ where: { id: segment.id } })).resolves.toMatchObject({ audioStatus: "READY", audioPath: assetPath, audioDurationMs: 1234 });
  });
});
