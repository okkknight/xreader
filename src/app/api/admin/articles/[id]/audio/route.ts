import { createHash } from "node:crypto";
import path from "node:path";

import { assertSameOrigin, requireAdmin } from "@/lib/auth/admin-session";
import { AudioCache } from "@/lib/audio/cache";
import { getFishAudioConfig } from "@/lib/audio/config";
import { FishProvider } from "@/lib/audio/fish-provider";
import { FfmpegAudioProcessor } from "@/lib/audio/media";
import { AudioStorage } from "@/lib/audio/storage";
import { prisma } from "@/lib/db/client";
import { generateAudioAsset } from "@/server/audio/generate-asset";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); assertSameOrigin(request); } catch { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params; const body = await request.json() as { segmentId?: string };
  if (!body.segmentId) return Response.json({ error: "segmentId is required" }, { status: 400 });
  try {
    const article = await prisma.article.findUniqueOrThrow({ where: { id }, include: { paragraphs: { include: { sentences: true } } } }); const segment = await prisma.lessonSegment.findFirstOrThrow({ where: { id: body.segmentId, articleId: id } });
    const sentenceText = new Map(article.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => [sentence.id, sentence.text] as const))); const text = segment.script || (Array.isArray(segment.sentenceIds) ? segment.sentenceIds.map((sentenceId) => sentenceText.get(String(sentenceId))).filter((value): value is string => Boolean(value)).join(" ") : "");
    if (!text) throw new Error("Segment has no audio text"); const config = getFishAudioConfig(); const referenceId = segment.voiceRole === "TEACHER" ? config.teacherReferenceId : config.readerReferenceId; if (!referenceId) throw new Error(`Missing reference ID for ${segment.voiceRole}`);
    const root = path.resolve(config.storageDir); const asset = await generateAudioAsset({ db: prisma, provider: new FishProvider({ apiKey: config.apiKey, model: config.model }), storage: new AudioStorage(root), cache: new AudioCache(path.join(root, ".cache")), processor: new FfmpegAudioProcessor(), articleId: id, ownerId: segment.id, ownerType: "LESSON_SEGMENT", text, textHash: createHash("sha256").update(text).digest("hex"), referenceId, model: config.model });
    await prisma.lessonSegment.update({ where: { id: segment.id }, data: { audioStatus: "READY", audioPath: asset.path, audioDurationMs: asset.durationMs, textHash: asset.textHash } }); return Response.json(asset);
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Audio generation failed" }, { status: 422 }); }
}
