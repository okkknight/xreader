import { execFile as execFileCallback } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import path from "node:path";
import { coursePaths } from "@/lib/course-blocks/filesystem";
import type { CourseDocument } from "@/lib/course-blocks/types";

const execFile = promisify(execFileCallback);
const args = process.argv.slice(2).filter((argument) => argument !== "--");
const slug = args[0];
if (!slug) throw new Error("Usage: npm run course:convert-audio -- <slug> [courses-root]");

async function main() {
  const paths = coursePaths(args[1] || "courses", slug);
  const root = path.resolve(process.env.AUDIO_STORAGE_DIR || "data/audio");
  const course = JSON.parse(await readFile(paths.build, "utf8")) as CourseDocument;
  const converted = new Map<string, string>();

  for (const audio of course.audio) {
    if (!audio.path.endsWith(".wav")) continue;
    const source = path.resolve(root, audio.path);
    const output = source.replace(/\.wav$/i, ".mp3");
    await execFile("ffmpeg", ["-y", "-i", source, "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", "44100", "-ac", "1", output]);
    converted.set(audio.path, path.relative(root, output));
  }

  const updatedAudio = course.audio.map((audio) => ({ ...audio, path: converted.get(audio.path) ?? audio.path }));
  await writeFile(paths.build, `${JSON.stringify({ ...course, audio: updatedAudio }, null, 2)}\n`);

  for (const sourcePath of converted.keys()) {
    await rm(path.resolve(root, sourcePath), { force: true });
  }

  for (const audioPath of converted.values()) {
    const manifestPath = path.join(root, audioPath.replace(/audio\.mp3$/i, "manifest.json"));
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { audio_file?: string };
      manifest.audio_file = "audio.mp3";
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    } catch {
      // Older generated assets may not have a manifest; the course path remains valid.
    }
  }

  console.log(`converted ${converted.size} audio files to MP3`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
