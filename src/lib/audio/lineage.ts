import { access, readFile } from "node:fs/promises";
import path from "node:path";

export async function validateAudioLineage({ directory, textHash }: { directory: string; textHash: string }) {
  const manifestPath = path.join(directory, "manifest.json");
  const timelinePath = path.join(directory, "timeline.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { script_sha256?: string; audio_file?: string; duration_ms?: number };
  const timeline = JSON.parse(await readFile(timelinePath, "utf8")) as { total_duration_ms?: number };
  if (manifest.script_sha256 !== textHash) throw new Error("script_sha256 does not match owner text hash");
  if (!manifest.audio_file) throw new Error("manifest is missing audio_file");
  await access(path.join(directory, manifest.audio_file));
  if (typeof manifest.duration_ms !== "number" || manifest.duration_ms < 0) throw new Error("manifest duration_ms is invalid");
  if (timeline.total_duration_ms !== manifest.duration_ms) throw new Error("timeline duration does not match manifest");
}
