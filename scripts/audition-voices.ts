import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getFishAudioConfig } from "@/lib/audio/config";
import { FishProvider } from "@/lib/audio/fish-provider";
import { FfmpegAudioProcessor } from "@/lib/audio/media";
import { AudioStorage } from "@/lib/audio/storage";

async function main() {
  const textPath = process.argv[process.argv.indexOf("--text") + 1];
  if (!textPath) throw new Error("Usage: npm run audio:audition -- --text <path>");
  const text = (await (await import("node:fs/promises")).readFile(textPath, "utf8")).trim();
  const config = getFishAudioConfig(); const provider = new FishProvider({ apiKey: config.apiKey, model: config.model }); const root = path.resolve(config.storageDir, "auditions"); await mkdir(root, { recursive: true }); const storage = new AudioStorage(root); const processor = new FfmpegAudioProcessor();
  for (const [role, referenceId] of [["teacher", config.teacherReferenceId], ["reader", config.readerReferenceId]] as const) {
    if (!referenceId) throw new Error(`Missing ${role} reference ID`);
    const result = await provider.synthesize({ text, referenceId, idempotencyKey: createHash("sha256").update(`${role}:${text}`).digest("hex") });
    const stored = await storage.writeVersion({ articleId: "audition", ownerId: role, ownerType: "COURSE_BLOCK" }, result.bytes, { textHash: createHash("sha256").update(text).digest("hex"), referenceId, model: config.model, durationMs: 0, providerRequestId: result.providerRequestId }, processor);
    await writeFile(path.join(root, `${role}-latest.txt`), stored.audioPath);
    console.log(`${role}: ${stored.audioPath}`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
