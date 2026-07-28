import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateAudioLineage } from "@/lib/audio/lineage";

describe("audio lineage", () => {
  it("rejects an asset whose manifest script hash differs from its owner text hash", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "xreader-lineage-"));
    await writeFile(path.join(root, "manifest.json"), JSON.stringify({ script_sha256: "wrong", audio_file: "audio.wav" }));
    await writeFile(path.join(root, "timeline.json"), JSON.stringify({ total_duration_ms: 1, lines: [] }));
    await writeFile(path.join(root, "audio.wav"), new Uint8Array([1]));
    await expect(validateAudioLineage({ directory: root, textHash: "expected" })).rejects.toThrow("script_sha256");
  });
});
