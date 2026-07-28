import { prisma } from "@/lib/db/client";
import { ArticleRepository } from "@/lib/db/article-repository";
import { seedCourse } from "./seed-course";

const courses = [
  ["review-tides", "Why Do Tides Change?", "潮汐为什么会变化？", "Nature & Science"],
  ["review-ink", "How Does Ink Reach Paper?", "墨水怎样留在纸上？", "Everyday Science"],
  ["review-maps", "Why Do Maps Need Scale?", "地图为什么需要比例尺？", "Ideas & Tools"],
  ["review-shade", "Why Does Shade Feel Cooler?", "阴影里为什么更凉？", "Nature & Science"],
] as const;

async function main() {
  const repository = new ArticleRepository(prisma);
  for (const [id, titleEn, titleZh, topic] of courses) {
    const course = structuredClone(seedCourse); course.article.id = id; course.article.slug = id; course.article.titleEn = titleEn; course.article.titleZh = titleZh; course.article.topic = topic; course.article.status = "ARTICLE_DRAFT"; delete course.article.publishedAt;
    course.paragraphs.forEach((paragraph, p) => { paragraph.id = `${id}-p${p + 1}`; paragraph.sentences.forEach((sentence, s) => { sentence.id = `${id}-p${p + 1}-s${s + 1}`; }); }); const sentenceIds = course.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => sentence.id));
    course.lessonSegments.forEach((segment, index) => { segment.id = `${id}-seg-${String(index + 1).padStart(2, "0")}`; segment.sentenceIds = segment.sentenceIds.map((_, sentenceIndex) => sentenceIds[(index + sentenceIndex) % sentenceIds.length]); }); course.annotations = [];
    await prisma.article.delete({ where: { id } }).catch(() => undefined); await repository.createCourse(course); console.log(`${id}: created as ARTICLE_DRAFT`);
  }
}
main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
