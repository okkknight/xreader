import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { relinkReadyGuideAudio } from "@/server/audio/relink-ready-audio";
import { seedCourse, seedCourseSources } from "./seed-course";

async function main() {
  await prisma.article.delete({ where: { id: seedCourse.article.id } }).catch(() => undefined);
  await new ArticleRepository(prisma).createCourse(seedCourse);
  for (const source of seedCourseSources) {
    await prisma.source.upsert({ where: { id: source.id }, create: { ...source, accessedAt: new Date() }, update: { ...source, accessedAt: new Date() } });
    await prisma.articleSource.upsert({ where: { articleId_sourceId: { articleId: seedCourse.article.id, sourceId: source.id } }, create: { articleId: seedCourse.article.id, sourceId: source.id, role: "FACT_CHECK", factNotes: { status: "REVIEWED_FOR_SEED", note: source.notes } }, update: { role: "FACT_CHECK", factNotes: { status: "REVIEWED_FOR_SEED", note: source.notes } } });
  }
  const restored = await relinkReadyGuideAudio(prisma, seedCourse.article.id, process.env.AUDIO_STORAGE_DIR || "data/audio");
  console.log(`restored ${restored} matching guide audio`);
  console.log(`imported ${seedCourse.article.slug}: ${seedCourse.paragraphGuides.length} paragraph guides, ${seedCourse.paragraphGuides.flatMap((guide) => guide.sentenceGuides).length} sentence guides`);
}

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
