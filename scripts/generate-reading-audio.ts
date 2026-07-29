import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { getFishAudioConfig } from "@/lib/audio/config";
import { FishProvider } from "@/lib/audio/fish-provider";
import { FfmpegAudioProcessor } from "@/lib/audio/media";
import { AudioStorage } from "@/lib/audio/storage";
import { ACTIVE_READER_PERFORMANCE } from "@/lib/audio/voice-library";
import type { CourseDocument } from "@/lib/course-blocks/types";
import { coursePaths } from "@/lib/course-blocks/filesystem";
import { parseSourceArticle } from "@/lib/course-blocks/source-parser";

const args = process.argv.slice(2).filter((argument) => argument !== "--");
const sentenceFlag = args.indexOf("--sentence");
const sentenceId = sentenceFlag >= 0 ? args[sentenceFlag + 1] : undefined;
const positional = sentenceFlag >= 0 ? args.filter((argument, index) => index !== sentenceFlag && index !== sentenceFlag + 1) : args;
const slug = positional[0];

if (!slug || (sentenceFlag >= 0 && !sentenceId)) throw new Error("Usage: npm run course:reading-audio -- <slug> [courses-root] [--sentence <sentence-id>]");

async function main() {
  const paths = coursePaths(positional[1] || "courses", slug);
  const [sourceMarkdown, courseJson] = await Promise.all([readFile(paths.source, "utf8"), readFile(paths.build, "utf8")]);
  const course = JSON.parse(courseJson) as CourseDocument;
  const sentences = parseSourceArticle(sourceMarkdown).paragraphs.flatMap((paragraph) => paragraph.sentences);
  const selected = sentenceId ? sentences.filter((sentence) => sentence.id === sentenceId) : sentences;
  if (sentenceId && !selected.length) throw new Error(`Unknown source sentence: ${sentenceId}`);

  const config = getFishAudioConfig();
  const provider = new FishProvider({ apiKey: config.apiKey, model: config.model });
  const storage = new AudioStorage(path.resolve(config.storageDir));
  const processor = new FfmpegAudioProcessor();
  const replacements = new Map<string, CourseDocument["audio"][number]>();

  for (const sentence of selected) {
    const scriptHash = createHash("sha256").update(sentence.text).digest("hex");
    const result = await provider.synthesize({
      text: sentence.text,
      referenceId: config.readerReferenceId,
      temperature: ACTIVE_READER_PERFORMANCE.temperature,
      prosody: ACTIVE_READER_PERFORMANCE.prosody,
      idempotencyKey: createHash("sha256").update(`${slug}:reading:${sentence.id}:${scriptHash}:${config.readerReferenceId}`).digest("hex"),
    });
    const stored = await storage.writeVersion({ articleId: slug, ownerId: sentence.id, ownerType: "SENTENCE" }, result.bytes, {
      textHash: scriptHash,
      referenceId: config.readerReferenceId,
      model: config.model,
      durationMs: 0,
      providerRequestId: result.providerRequestId,
    }, processor);
    replacements.set(sentence.id, {
      audioId: `${slug}-reading-${sentence.id}`,
      blockIds: [],
      sentenceId: sentence.id,
      path: stored.audioPath,
      durationMs: stored.durationMs,
      status: "ready",
      scriptHash,
    });
    console.log(`${sentence.id}: ${stored.durationMs}ms`);
  }

  const guidedAudio = course.audio.filter((audio) => !audio.sentenceId);
  const existingReading = new Map(course.audio.filter((audio) => audio.sentenceId).map((audio) => [audio.sentenceId!, audio]));
  const readingAudio = sentences.flatMap((sentence) => {
    const audio = replacements.get(sentence.id) ?? existingReading.get(sentence.id);
    return audio ? [audio] : [];
  });
  await writeFile(paths.build, `${JSON.stringify({ ...course, audio: [...guidedAudio, ...readingAudio] }, null, 2)}\n`);
  console.log(`generated ${replacements.size} Godsplan reader audio files with ${config.readerReferenceId}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
