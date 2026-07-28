import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { relinkReadyLessonAudio } from "@/server/audio/relink-ready-audio";
import { seedCourse } from "./seed-course";

async function main() {
  const repository = new ArticleRepository(prisma);
  await prisma.article.delete({ where: { id: seedCourse.article.id } }).catch(() => undefined);
  await repository.createCourse(seedCourse);
  const restored = await relinkReadyLessonAudio(prisma, seedCourse.article.id, process.env.AUDIO_STORAGE_DIR || "data/audio");
  console.log(`seed-rain: restored ${restored} matching audio assets`);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
