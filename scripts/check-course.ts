import { readFile } from "node:fs/promises";
import process from "node:process";
import { coursePaths } from "@/lib/course-blocks/filesystem";
import { parseSourceArticle } from "@/lib/course-blocks/source-parser";
import { anchorFinalLecture } from "@/lib/course-blocks/lecture-parser";
import { courseDocumentSchema } from "@/lib/course-blocks/schema";
import { missingSubtitleBlockIds } from "@/lib/audio/subtitle-cues";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const slug = args[0];

async function main() {
  if (!slug) throw new Error("Usage: npm run course:check -- <slug> [courses-root]");
  const paths = coursePaths(args[1] || "courses", slug);
  const [source, finalLecture, courseJson] = await Promise.all([readFile(paths.source, "utf8"), readFile(paths.finalLecture, "utf8"), readFile(paths.build, "utf8")]);
  const article = parseSourceArticle(source);
  const anchors = anchorFinalLecture(article, finalLecture);
  const course = courseDocumentSchema.parse(JSON.parse(courseJson));
  const missingSubtitles = missingSubtitleBlockIds(course);
  if (missingSubtitles.length) throw new Error(`Ready audio blocks are missing subtitle cues: ${missingSubtitles.join(", ")}`);
  console.log(JSON.stringify({ slug, title: article.title, sourceSentences: article.paragraphs.flatMap((paragraph) => paragraph.sentences).length, anchors: anchors.anchors.length, subtitleCues: course.blocks.reduce((count, block) => count + (block.subtitleCues?.length ?? 0), 0), finalLecture: paths.finalLecture }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
