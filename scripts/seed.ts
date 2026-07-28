import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { seedCourse } from "./seed-course";

async function main() {
  const repository = new ArticleRepository(prisma);
  await prisma.article.delete({ where: { id: seedCourse.article.id } }).catch(() => undefined);
  await repository.createCourse(seedCourse);
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
