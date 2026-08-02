import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

export interface AudioProcessor {
  normalizeAndMeasure(inputPath: string, outputPath: string): Promise<number>;
}

export class FfmpegAudioProcessor implements AudioProcessor {
  async normalizeAndMeasure(inputPath: string, outputPath: string): Promise<number> {
    await execFile("ffmpeg", [
      "-y", "-i", inputPath,
      "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ar", "44100", "-ac", "1", "-sample_fmt", "s16",
      "-codec:a", "libmp3lame", "-b:a", "96k",
      outputPath,
    ]);

    const { stdout } = await execFile("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", outputPath,
    ]);
    const durationSeconds = Number.parseFloat(stdout.trim());
    if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
      throw new Error(`ffprobe returned an invalid duration for ${outputPath}`);
    }
    return Math.round(durationSeconds * 1000);
  }
}
