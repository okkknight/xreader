import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AudioOwner } from "./types";
import type { AudioProcessor } from "./media";

type VersionMetadata = {
  textHash: string;
  referenceId: string;
  model: string;
  durationMs: number;
  providerRequestId?: string;
};

export type StoredAudioVersion = {
  versionId: string;
  audioPath: string;
  manifestPath: string;
  timelinePath: string;
  durationMs: number;
};

export class AudioStorage {
  constructor(private readonly root: string) {}

  async writeVersion(owner: AudioOwner, bytes: Uint8Array, metadata: VersionMetadata, processor?: AudioProcessor): Promise<StoredAudioVersion> {
    const versionId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
    const directory = path.join(this.root, owner.articleId, owner.ownerId, versionId);
    await mkdir(directory, { recursive: true });

    const audioPath = path.join(directory, "audio.mp3");
    const manifestPath = path.join(directory, "manifest.json");
    const timelinePath = path.join(directory, "timeline.json");
    const relativeAudioPath = path.relative(this.root, audioPath);

    let durationMs = metadata.durationMs;
    if (processor) {
      const sourcePath = path.join(directory, "source.wav");
      await writeFile(sourcePath, bytes);
      try {
        durationMs = await processor.normalizeAndMeasure(sourcePath, audioPath);
      } finally {
        await rm(sourcePath, { force: true });
      }
    } else {
      await writeFile(audioPath, bytes);
    }
    await writeFile(manifestPath, JSON.stringify({
      generated_at: new Date().toISOString(),
      owner_type: owner.ownerType,
      owner_id: owner.ownerId,
      model: metadata.model,
      reference_id: metadata.referenceId,
      script_sha256: metadata.textHash,
      duration_ms: durationMs,
      provider_request_id: metadata.providerRequestId,
      audio_file: "audio.mp3",
    }, null, 2));
    await writeFile(timelinePath, JSON.stringify({ owner_id: owner.ownerId, total_duration_ms: durationMs, lines: [] }, null, 2));

    return { versionId, audioPath: relativeAudioPath, manifestPath, timelinePath, durationMs };
  }
}
