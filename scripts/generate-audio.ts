import { createHash } from "node:crypto";
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db/client";
import { AudioCache } from "@/lib/audio/cache";
import { getFishAudioConfig } from "@/lib/audio/config";
import { FishProvider } from "@/lib/audio/fish-provider";
import { FfmpegAudioProcessor } from "@/lib/audio/media";
import { AudioStorage } from "@/lib/audio/storage";
import { generateAudioAsset } from "@/server/audio/generate-asset";

function argument(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : undefined; }

async function main() {
  const slug = argument("--article"); const ownerId = argument("--owner"); const mode = argument("--mode") || "guided";
  if (!slug) throw new Error("Usage: npm run audio:generate -- --article <slug> [--owner <paragraph-guide-id>] [--mode guided|reading]");
  const config = getFishAudioConfig(); const article = await prisma.article.findFirst({ where: { OR: [{ slug }, { id: slug }] }, include: { paragraphs: { include: { sentences: true } }, paragraphGuides: { orderBy: { order: "asc" }, include: { sentenceGuides: true } } } });
  if (!article) throw new Error(`Article not found: ${slug}`);
  const root = path.resolve(config.storageDir); const provider = new FishProvider({ apiKey: config.apiKey, model: config.model }); const storage = new AudioStorage(root); const cache = new AudioCache(path.join(root, ".cache")); const processor = new FfmpegAudioProcessor();
  if (mode === "reading") {
    const sentences = article.paragraphs.flatMap((paragraph) => paragraph.sentences).filter((sentence) => !ownerId || sentence.id === ownerId);
    for (const sentence of sentences) { const textHash = createHash("sha256").update(sentence.text).digest("hex"); const asset = await generateAudioAsset({ db: prisma, provider, storage, cache, processor, articleId: article.id, ownerId: sentence.id, ownerType: "SENTENCE", text: sentence.text, textHash, referenceId: config.readerReferenceId, model: config.model }); console.log(`${sentence.id}: READY ${asset.path}`); }
  } else {
    const guides = article.paragraphGuides.filter((guide) => !ownerId || guide.id === ownerId);
    for (const guide of guides) {
      await prisma.paragraphGuide.update({ where: { id: guide.id }, data: { audioStatus: "GENERATING" } });
      try {
        const textHash = createHash("sha256").update(guide.scriptText).digest("hex"); const asset = await generateAudioAsset({ db: prisma, provider, storage, cache, processor, articleId: article.id, ownerId: guide.id, ownerType: "PARAGRAPH_GUIDE", text: guide.scriptText, textHash, referenceId: config.teacherReferenceId, model: config.model });
        const weights = guide.sentenceGuides.map((sentence) => sentence.originalReadText.length + sentence.meaningZh.length + (sentence.focusScript?.length || 0) + (sentence.bridgeScript?.length || 0)); const totalWeight = weights.reduce((sum, weight) => sum + weight, 0); let cursor = Math.min(800, Math.round(asset.durationMs * 0.12));
        const ranges: Array<{ sentence_id: string; start_ms: number; end_ms: number }> = [];
        for (const [index, sentence] of guide.sentenceGuides.entries()) { const start = cursor; const end = index === guide.sentenceGuides.length - 1 ? Math.max(start + 1, asset.durationMs - 700) : start + Math.max(1, Math.round((asset.durationMs - cursor - 700) * (weights[index] / Math.max(1, totalWeight)))); cursor = end; ranges.push({ sentence_id: sentence.sentenceId, start_ms: start, end_ms: end }); await prisma.sentenceGuide.update({ where: { id: sentence.id }, data: { estimatedStartMs: start, estimatedEndMs: end } }); }
        const timelinePath = path.join(root, path.dirname(asset.path), "timeline.json"); await writeFile(timelinePath, JSON.stringify({ owner_id: guide.id, total_duration_ms: asset.durationMs, estimated: true, lines: ranges }, null, 2));
        await prisma.paragraphGuide.update({ where: { id: guide.id }, data: { audioStatus: "READY", audioPath: asset.path, audioDurationMs: asset.durationMs, textHash: asset.textHash } }); console.log(`${guide.id}: READY ${asset.path}`);
      } catch (error) { await prisma.paragraphGuide.update({ where: { id: guide.id }, data: { audioStatus: "FAILED" } }); throw error; }
    }
  }
}
main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
