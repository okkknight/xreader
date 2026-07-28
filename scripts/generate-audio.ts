import { createHash } from "node:crypto";
import path from "node:path";

import { prisma } from "@/lib/db/client";
import { AudioCache } from "@/lib/audio/cache";
import { getFishAudioConfig } from "@/lib/audio/config";
import { FishProvider } from "@/lib/audio/fish-provider";
import { FfmpegAudioProcessor } from "@/lib/audio/media";
import { AudioStorage } from "@/lib/audio/storage";
import { generateAudioAsset } from "@/server/audio/generate-asset";

function argument(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }

async function main() {
  const slug = argument("--article"); const ownerId = argument("--owner");
  if (!slug) throw new Error("Usage: npm run audio:generate -- --article <slug> [--owner <segment-id>]");
  const config = getFishAudioConfig(); const article = await prisma.article.findFirst({ where: { OR: [{ slug }, { id: slug }] }, include: { paragraphs: { include: { sentences: true } }, lessonSegments: { orderBy: { order: "asc" } } } });
  if (!article) throw new Error(`Article not found: ${slug}`);
  const sentenceText = new Map(article.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => [sentence.id, sentence.text] as const)));
  const segments = article.lessonSegments.filter((segment) => !ownerId || segment.id === ownerId);
  if (!segments.length) throw new Error("No matching lesson segment");
  const root = path.resolve(config.storageDir); const provider = new FishProvider({ apiKey: config.apiKey, model: config.model }); const storage = new AudioStorage(root); const cache = new AudioCache(path.join(root, ".cache")); const processor = new FfmpegAudioProcessor();
  for (const segment of segments) {
    const text = segment.script || (Array.isArray(segment.sentenceIds) ? segment.sentenceIds.map((id) => sentenceText.get(String(id))).filter((value): value is string => Boolean(value)).join(" ") : "");
    if (!text) throw new Error(`Segment ${segment.id} has no script or sentence text`);
    await prisma.lessonSegment.update({ where: { id: segment.id }, data: { audioStatus: "GENERATING" } });
    try {
      const referenceId = segment.voiceRole === "TEACHER" ? config.teacherReferenceId : config.readerReferenceId;
      if (!referenceId) throw new Error(`Missing Fish Audio reference ID for ${segment.voiceRole}`);
      const asset = await generateAudioAsset({ db: prisma, provider, storage, cache, processor, articleId: article.id, ownerType: "LESSON_SEGMENT", ownerId: segment.id, text, textHash: createHash("sha256").update(text).digest("hex"), referenceId, model: config.model });
      await prisma.lessonSegment.update({ where: { id: segment.id }, data: { audioStatus: "READY", audioPath: asset.path, audioDurationMs: asset.durationMs, textHash: asset.textHash } });
      console.log(`${segment.id}: READY ${asset.path}`);
    } catch (error) { await prisma.lessonSegment.update({ where: { id: segment.id }, data: { audioStatus: "FAILED" } }); throw error; }
  }
}

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
