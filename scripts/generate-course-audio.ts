import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getFishAudioConfig } from "@/lib/audio/config";
import { FishProvider } from "@/lib/audio/fish-provider";
import { FfmpegAudioProcessor } from "@/lib/audio/media";
import { AudioStorage } from "@/lib/audio/storage";
import { renderTeacherBlockText } from "@/lib/audio/teacher-rendering";
import { ACTIVE_TEACHER_PERFORMANCE } from "@/lib/audio/voice-library";
import { ensureBlockHighlightCues, resolveHighlightCueTimings } from "@/lib/audio/highlight-cues";
import { buildSubtitleCues } from "@/lib/audio/subtitle-cues";
import type { CourseDocument } from "@/lib/course-blocks/types";
import { coursePaths } from "@/lib/course-blocks/filesystem";
import { parseSourceArticle } from "@/lib/course-blocks/source-parser";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const blockFlag = args.indexOf("--block");
const blockId = blockFlag >= 0 ? args[blockFlag + 1] : undefined;
const positional = blockFlag >= 0 ? args.filter((argument, index) => index !== blockFlag && index !== blockFlag + 1) : args;
const slug = positional[0];
if (!slug || (blockFlag >= 0 && !blockId)) throw new Error("Usage: npm run course:audio -- <slug> [courses-root] [--block <block-id>]");

async function main() {
  const paths = coursePaths(positional[1] || "courses", slug);
  const [sourceMarkdown, courseJson] = await Promise.all([readFile(paths.source, "utf8"), readFile(paths.build, "utf8")]);
  const course = JSON.parse(courseJson) as CourseDocument;
  const sourceSentenceById = new Map(parseSourceArticle(sourceMarkdown).paragraphs.flatMap((paragraph) => paragraph.sentences).map((sentence) => [sentence.id, sentence.text]));
  const config = getFishAudioConfig();
  const provider = new FishProvider({ apiKey: config.apiKey, model: config.model });
  const storage = new AudioStorage(path.resolve(config.storageDir));
  const processor = new FfmpegAudioProcessor();
  const replacementAudio = new Map<string, CourseDocument["audio"][number]>();
  const timedCuesByBlock = new Map<string, NonNullable<CourseDocument["blocks"][number]["highlightCues"]>>();
  const subtitleCuesByBlock = new Map<string, NonNullable<CourseDocument["blocks"][number]["subtitleCues"]>>();
  const blocks = blockId ? course.blocks.filter((block) => block.id === blockId) : course.blocks;
  if (blockId && !blocks.length) throw new Error(`Unknown course block: ${blockId}`);
  for (const block of blocks) {
    const text = renderTeacherBlockText(block, sourceSentenceById);
    if (!text) continue;
    const scriptHash = createHash("sha256").update(text).digest("hex");
    const result = await provider.synthesizeWithTimestamps({ text, referenceId: config.teacherReferenceId, temperature: ACTIVE_TEACHER_PERFORMANCE.temperature, prosody: ACTIVE_TEACHER_PERFORMANCE.prosody, idempotencyKey: createHash("sha256").update(`${slug}:${block.id}:${scriptHash}`).digest("hex") });
    let highlightCues;
    try {
      highlightCues = resolveHighlightCueTimings(result.alignment, ensureBlockHighlightCues(block, sourceSentenceById, course.title));
    } catch (error) {
      const alignmentText = result.alignment.map((segment) => segment.text).join(" ").slice(0, 2_000);
      throw new Error(`${error instanceof Error ? error.message : String(error)}\nFish alignment: ${alignmentText}`);
    }
    const stored = await storage.writeVersion({ articleId: slug, ownerId: block.id, ownerType: "COURSE_BLOCK" }, result.bytes, { textHash: scriptHash, referenceId: config.teacherReferenceId, model: config.model, durationMs: 0, providerRequestId: result.providerRequestId }, processor);
    await writeFile(stored.timelinePath, JSON.stringify({ owner_id: block.id, total_duration_ms: stored.durationMs, alignment: result.alignment, highlight_cues: highlightCues }, null, 2));
    replacementAudio.set(block.id, { audioId: `${slug}-${block.id}`, blockIds: [block.id], path: stored.audioPath, durationMs: stored.durationMs, status: "ready", scriptHash });
    timedCuesByBlock.set(block.id, highlightCues);
    subtitleCuesByBlock.set(block.id, buildSubtitleCues(block, result.alignment));
    console.log(`${block.id}: ${stored.durationMs}ms`);
  }
  const guidedAudio = course.blocks.flatMap((block) => replacementAudio.get(block.id) ?? course.audio.filter((item) => item.blockIds.includes(block.id)));
  const readingAudio = course.audio.filter((item) => item.sentenceId);
  const audio = [...guidedAudio, ...readingAudio];
  const updatedBlocks = course.blocks.map((block) => timedCuesByBlock.has(block.id) ? { ...block, highlightCues: timedCuesByBlock.get(block.id), subtitleCues: subtitleCuesByBlock.get(block.id) } : block);
  await writeFile(paths.build, `${JSON.stringify({ ...course, blocks: updatedBlocks, audio }, null, 2)}\n`);
  console.log(`generated ${replacementAudio.size} Course Block audio files`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
