import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function audioCacheKey(input: { text: string; referenceId: string; model: string; format: string; prosody?: unknown }) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export class AudioCache {
  constructor(private readonly root: string) {}

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(path.join(this.root, `${key}.wav`)));
    } catch {
      return null;
    }
  }

  async put(key: string, bytes: Uint8Array): Promise<void> {
    await mkdir(this.root, { recursive: true });
    await writeFile(path.join(this.root, `${key}.wav`), bytes);
  }
}
