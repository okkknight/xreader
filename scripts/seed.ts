import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { relinkReadyLessonAudio } from "@/server/audio/relink-ready-audio";
import { seedCourse, seedCourseSources } from "./seed-course";

async function main() {
  const repository = new ArticleRepository(prisma);
  const previousArticle = await prisma.article.findUnique({ where: { id: seedCourse.article.id }, include: { paragraphs: { include: { sentences: true } }, lessonSegments: true } });
  if (previousArticle) {
    const previousSentences = new Map(previousArticle.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => [sentence.id, sentence.text] as const)));
    const nextSentences = new Map(seedCourse.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => [sentence.id, sentence.text] as const)));
    const nextSegments = new Map(seedCourse.lessonSegments.map((segment) => [segment.id, segment] as const));
    for (const segment of previousArticle.lessonSegments) {
      const next = nextSegments.get(segment.id);
      const previousText = segment.script || (Array.isArray(segment.sentenceIds) ? segment.sentenceIds.map((id) => previousSentences.get(String(id))).filter((text): text is string => Boolean(text)).join(" ") : "");
      const nextText = next?.script || (next && next.sentenceIds.map((id) => nextSentences.get(id)).filter((text): text is string => Boolean(text)).join(" ")) || "";
      const nextHash = createHash("sha256").update(nextText).digest("hex");
      if (!next || !segment.textHash || segment.textHash !== nextHash || previousText === "") {
        await prisma.audioAsset.updateMany({ where: { ownerType: "LESSON_SEGMENT", ownerId: segment.id, status: "READY" }, data: { status: "STALE" } });
      }
    }
  }
  await prisma.article.delete({ where: { id: seedCourse.article.id } }).catch(() => undefined);
  await repository.createCourse(seedCourse);
  for (const source of seedCourseSources) {
    await prisma.source.upsert({ where: { id: source.id }, create: { ...source, accessedAt: new Date() }, update: { ...source, accessedAt: new Date() } });
    await prisma.articleSource.upsert({ where: { articleId_sourceId: { articleId: seedCourse.article.id, sourceId: source.id } }, create: { articleId: seedCourse.article.id, sourceId: source.id, role: "FACT_CHECK", factNotes: { status: "REVIEWED_FOR_SEED", note: source.notes } }, update: { role: "FACT_CHECK", factNotes: { status: "REVIEWED_FOR_SEED", note: source.notes } } });
  }
  const restored = await relinkReadyLessonAudio(prisma, seedCourse.article.id, process.env.AUDIO_STORAGE_DIR || "data/audio");
  console.log(`seed-rain: restored ${restored} matching audio assets`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
