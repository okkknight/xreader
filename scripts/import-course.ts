import { readFile } from "node:fs/promises";
import process from "node:process";
import { prisma } from "@/lib/db/client";
import { courseDocumentSchema } from "@/lib/course-blocks/schema";
import { coursePaths } from "@/lib/course-blocks/filesystem";
import { parseSourceArticle } from "@/lib/course-blocks/source-parser";
import { CourseDocumentRepository } from "@/lib/db/course-document-repository";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const slug = args[0];
if (!slug) throw new Error("Usage: npm run course:import -- <slug> [courses-root]");

async function main() {
  const paths = coursePaths(args[1] || "courses", slug);
  const sourceMarkdown = await readFile(paths.source, "utf8");
  const finalLectureMarkdown = await readFile(paths.finalLecture, "utf8");
  const course = courseDocumentSchema.parse(JSON.parse(await readFile(paths.build, "utf8")));
  const source = parseSourceArticle(sourceMarkdown);
  const articleId = `course-${slug}`;
  const bodyText = source.paragraphs.map((paragraph) => paragraph.text).join("\n\n");

  await prisma.$transaction(async (transaction) => {
    await transaction.article.deleteMany({ where: { id: articleId } });
    await transaction.article.create({
      data: {
        id: articleId,
        slug,
        titleEn: source.title,
        titleZh: "为什么雨会有气味？",
        dekZh: "从干燥的土地到第一滴雨，空气里发生了什么。",
        topic: "Nature & Science",
        difficulty: "B1-B2",
        status: "PUBLISHED",
        bodyText,
        wordCount: bodyText.trim().split(/\s+/).filter(Boolean).length,
        publishedAt: new Date(),
        paragraphs: { create: source.paragraphs.map((paragraph) => ({ id: `${articleId}-${paragraph.id}`, order: paragraph.order, text: paragraph.text, sentences: { create: paragraph.sentences.map((sentence) => ({ id: sentence.id, order: sentence.order, text: sentence.text })) } })) },
      },
    });
  });

  const imported = await new CourseDocumentRepository(prisma).importBuiltCourse({
    articleId,
    sourceMarkdown,
    finalLectureMarkdown,
    sourceHash: course.sourceHash,
    finalLectureHash: course.finalLectureHash,
    course,
    parseReport: { needsReview: [], importedAt: new Date().toISOString(), sourceSentences: source.paragraphs.flatMap((paragraph) => paragraph.sentences).length },
  });
  console.log(JSON.stringify({ articleId, slug, blocks: course.blocks.length, audio: imported.audio.length, status: imported.status }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
