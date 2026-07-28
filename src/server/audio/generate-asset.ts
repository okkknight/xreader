import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

import { AudioCache, audioCacheKey } from "@/lib/audio/cache";
import { AudioStorage } from "@/lib/audio/storage";
import type { AudioProcessor } from "@/lib/audio/media";
import type { AudioOwner, TTSProvider } from "@/lib/audio/types";

type GenerateAssetInput = AudioOwner & {
  db: PrismaClient;
  provider: TTSProvider;
  storage: AudioStorage;
  cache?: AudioCache;
  text: string;
  textHash: string;
  referenceId: string;
  model: string;
  durationMs?: number;
  prosody?: { speed?: number; volume?: number };
  processor?: AudioProcessor;
};

export async function generateAudioAsset(input: GenerateAssetInput) {
  const cacheKey = audioCacheKey({
    text: input.text,
    referenceId: input.referenceId,
    model: input.model,
    format: "wav",
    prosody: input.prosody,
  });
  let bytes = input.cache ? await input.cache.get(cacheKey) : null;
  let providerRequestId: string | undefined;

  if (!bytes) {
    const result = await input.provider.synthesize({
      text: input.text,
      referenceId: input.referenceId,
      idempotencyKey: createHash("sha256").update(`${input.ownerId}:${input.textHash}`).digest("hex"),
      prosody: input.prosody,
    });
    bytes = result.bytes;
    providerRequestId = result.providerRequestId;
    if (input.cache) await input.cache.put(cacheKey, bytes);
  }

  const stored = await input.storage.writeVersion(input, bytes, {
    textHash: input.textHash,
    referenceId: input.referenceId,
    model: input.model,
    durationMs: input.durationMs ?? 0,
    providerRequestId,
  }, input.processor);

  return input.db.audioAsset.create({
    data: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      provider: "fish-audio",
      voiceId: input.referenceId,
      path: stored.audioPath,
      format: "wav",
      durationMs: stored.durationMs,
      textHash: input.textHash,
      providerRequestId,
      status: "READY",
    },
  });
}

export async function invalidateAssetsForText(db: PrismaClient, ownerId: string, previousHash: string, nextHash: string) {
  if (previousHash === nextHash) return 0;
  const result = await db.audioAsset.updateMany({
    where: { ownerId, textHash: previousHash, status: "READY" },
    data: { status: "STALE" },
  });
  return result.count;
}
