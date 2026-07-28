import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { AudioStorage } from "@/lib/audio/storage";
import type { TTSProvider } from "@/lib/audio/types";
import { generateAudioAsset, invalidateAssetsForText } from "@/server/audio/generate-asset";
import { prisma } from "@/lib/db/client";

const provider: TTSProvider = {
  synthesize: async () => ({ bytes: new Uint8Array([82, 73, 70, 70]), providerRequestId: "request" }),
};

describe("generateAudioAsset", () => {
  it("persists a ready version and marks old text assets stale", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "xreader-generate-"));
    const storage = new AudioStorage(root);
    const asset = await generateAudioAsset({
      db: prisma,
      provider,
      storage,
      articleId: "article",
      ownerType: "PARAGRAPH_GUIDE",
      ownerId: "guide",
      text: "A short lesson.",
      textHash: "new-hash",
      referenceId: "voice",
      model: "s2.1-pro-free",
    });

    expect(asset.status).toBe("READY");
    expect(asset.path).toContain("article/guide/");
    await expect(invalidateAssetsForText(prisma, "guide", "new-hash", "next-hash")).resolves.toBe(1);
    expect((await prisma.audioAsset.findUniqueOrThrow({ where: { id: asset.id } })).status).toBe("STALE");
  });
});
