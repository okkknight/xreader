import { access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";

export async function relinkReadyGuideAudio(db: PrismaClient, articleId: string, storageRoot: string) {
  const guides = await db.paragraphGuide.findMany({ where: { articleId }, orderBy: { order: "asc" } });
  const assets = await db.audioAsset.findMany({ where: { ownerType: "PARAGRAPH_GUIDE", ownerId: { in: guides.map((guide) => guide.id) }, status: "READY" }, orderBy: { createdAt: "desc" } });
  let restored = 0;
  for (const guide of guides) {
    const textHash = createHash("sha256").update(guide.scriptText).digest("hex");
    const asset = assets.find((candidate) => candidate.ownerId === guide.id && candidate.textHash === textHash);
    if (!asset) continue;
    try { await access(path.join(storageRoot, asset.path)); } catch { continue; }
    await db.paragraphGuide.update({ where: { id: guide.id }, data: { audioStatus: "READY", audioPath: asset.path, audioDurationMs: asset.durationMs, textHash: asset.textHash } });
    restored += 1;
  }
  return restored;
}
