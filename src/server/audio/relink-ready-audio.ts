import { createHash } from "node:crypto";
import { access } from "node:fs/promises";
import path from "node:path";

import type { PrismaClient } from "@prisma/client";

function segmentText(segment: { script: string | null; sentenceIds: unknown }, sentences: Map<string, string>) {
  return segment.script || (Array.isArray(segment.sentenceIds) ? segment.sentenceIds.map((id) => sentences.get(String(id))).filter((text): text is string => Boolean(text)).join(" ") : "");
}

async function isStoredFile(storageRoot: string, relativePath: string) {
  const target = path.resolve(storageRoot, relativePath); const root = path.resolve(storageRoot);
  if (!target.startsWith(`${root}${path.sep}`)) return false;
  try { await access(target); return true; } catch { return false; }
}

export async function relinkReadyLessonAudio(db: PrismaClient, articleId: string, storageRoot: string) {
  const article = await db.article.findUniqueOrThrow({ where: { id: articleId }, include: { paragraphs: { include: { sentences: true } }, lessonSegments: { orderBy: { order: "asc" } } } });
  const assets = await db.audioAsset.findMany({ where: { ownerType: "LESSON_SEGMENT", ownerId: { in: article.lessonSegments.map((segment) => segment.id) }, status: "READY" }, orderBy: { createdAt: "desc" } });
  const sentences = new Map(article.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => [sentence.id, sentence.text] as const)));
  let restored = 0;
  for (const segment of article.lessonSegments) {
    const text = segmentText(segment, sentences); if (!text) continue;
    const textHash = createHash("sha256").update(text).digest("hex");
    const asset = assets.find((candidate) => candidate.ownerId === segment.id && candidate.textHash === textHash && candidate.path && candidate.durationMs > 0);
    if (!asset || !await isStoredFile(storageRoot, asset.path)) continue;
    await db.lessonSegment.update({ where: { id: segment.id }, data: { audioStatus: "READY", audioPath: asset.path, audioDurationMs: asset.durationMs, textHash } });
    restored += 1;
  }
  return restored;
}
