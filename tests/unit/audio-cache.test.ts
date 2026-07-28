import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { AudioStorage } from "@/lib/audio/storage";
import type { AudioProcessor } from "@/lib/audio/media";

describe("AudioStorage", () => {
  it("writes a new version without replacing the previous manifest", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "xreader-audio-"));
    const storage = new AudioStorage(root);
    const owner = { articleId: "article", ownerId: "segment", ownerType: "LESSON_SEGMENT" as const };
    const first = await storage.writeVersion(owner, new Uint8Array([1, 2]), { textHash: "hash", referenceId: "voice", model: "model", durationMs: 10 });
    const second = await storage.writeVersion(owner, new Uint8Array([1, 2]), { textHash: "hash", referenceId: "voice", model: "model", durationMs: 10 });

    expect(second.versionId).not.toBe(first.versionId);
    expect(JSON.parse(await readFile(first.manifestPath, "utf8"))).toMatchObject({ script_sha256: "hash" });
  });

  it("records the normalized duration when a media processor is supplied", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "xreader-audio-"));
    const storage = new AudioStorage(root);
    const processor: AudioProcessor = { normalizeAndMeasure: async (_input, output) => {
      await writeFile(output, new Uint8Array([1, 2]));
      return 321;
    } };
    const result = await storage.writeVersion(
      { articleId: "article", ownerId: "segment", ownerType: "LESSON_SEGMENT" },
      new Uint8Array([1, 2]),
      { textHash: "hash", referenceId: "voice", model: "model", durationMs: 0 },
      processor,
    );

    expect(JSON.parse(await readFile(result.manifestPath, "utf8"))).toMatchObject({ duration_ms: 321 });
  });
});
