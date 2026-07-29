import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { buildCourseDocument } from "@/lib/course-blocks/build-course";
import { coursePaths } from "@/lib/course-blocks/filesystem";
import { anchorFinalLecture } from "@/lib/course-blocks/lecture-parser";
import { normalizeLectureText, parseSourceArticle } from "@/lib/course-blocks/source-parser";
import type { SemanticLabel } from "@/lib/course-blocks/semantic-labels";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const slug = args[0];
async function main() {
  if (!slug) throw new Error("Usage: npm run course:build -- <slug> [courses-root]");
  const paths = coursePaths(args[1] || "courses", slug);
  const sourceMarkdown = await readFile(paths.source, "utf8");
  const finalLectureMarkdown = await readFile(paths.finalLecture, "utf8");
  const source = parseSourceArticle(sourceMarkdown);
  const normalized = normalizeLectureText(finalLectureMarkdown);
  const anchors = anchorFinalLecture(source, finalLectureMarkdown).anchors;
  const titleStart = normalized.indexOf(source.title);
  if (titleStart < 0) throw new Error("final lecture is missing the source title");
  const firstSentenceStart = anchors[0]?.start;
  if (firstSentenceStart === undefined || titleStart >= firstSentenceStart) throw new Error("final lecture title must precede the first source sentence");

  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  const labels: SemanticLabel[] = [];
  const add = (type: SemanticLabel["type"], start: number, end: number, role: SemanticLabel["role"], sentenceId?: string) => {
    if (end <= start) return;
    labels.push({ id: `label-${String(labels.length + 1).padStart(3, "0")}`, type, start, end, textHash: hash(normalized.slice(start, end)), role, sentenceId });
  };
  add("intro", 0, titleStart, "warmth");
  add("title", titleStart, firstSentenceStart, "transition");
  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index];
    const nextStart = anchors[index + 1]?.start ?? anchor.end;
    add("sentence", anchor.start, nextStart, anchor.roleHint === "reread" ? "reread" : "original", anchor.sentenceId);
  }
  const lastEnd = anchors.at(-1)?.end ?? firstSentenceStart;
  add("outro", lastEnd, normalized.length, "warmth");

  const course = buildCourseDocument({ slug, title: source.title, sourceMarkdown, finalLectureMarkdown: normalized, labels });
  const buildDirectory = paths.build.replace(/\/course\.json$/, "");
  await mkdir(buildDirectory, { recursive: true });
  await writeFile(paths.build, `${JSON.stringify(course, null, 2)}\n`);
  await writeFile(`${buildDirectory}/labels.json`, `${JSON.stringify(labels, null, 2)}\n`);
  await writeFile(`${buildDirectory}/parse-report.json`, `${JSON.stringify({ needsReview: [], sourceSentences: source.paragraphs.flatMap((paragraph) => paragraph.sentences).length, anchoredOccurrences: anchors.length, blocks: course.blocks.length }, null, 2)}\n`);
  console.log(JSON.stringify({ slug, sourceSentences: source.paragraphs.flatMap((paragraph) => paragraph.sentences).length, anchoredOccurrences: anchors.length, blocks: course.blocks.length, output: paths.build }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
