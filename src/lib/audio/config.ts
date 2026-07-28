export type FishAudioConfig = {
  apiKey: string;
  model: string;
  teacherReferenceId: string;
  readerReferenceId: string;
  storageDir: string;
};

export function getFishAudioConfig(env: NodeJS.ProcessEnv = process.env): FishAudioConfig {
  const apiKey = env.FISH_AUDIO_API_KEY?.trim() || env.FISH_API_KEY?.trim() || (env === process.env ? readHolyVoiceApiKey(env) : undefined);
  if (!apiKey) throw new Error("FISH_AUDIO_API_KEY is required for Fish Audio generation");

  return {
    apiKey,
    model: env.FISH_AUDIO_MODEL?.trim() || "s2.1-pro-free",
    teacherReferenceId: env.FISH_TEACHER_REFERENCE_ID?.trim() || "76fcd904aa4b4a47af107686abd68248",
    readerReferenceId: env.FISH_READER_REFERENCE_ID?.trim() || "7491491700cd43b1a551d5efb4dca9c7",
    storageDir: env.AUDIO_STORAGE_DIR?.trim() || "data/audio",
  };
}

function readHolyVoiceApiKey(env: NodeJS.ProcessEnv) {
  const configuredPath = env.HOLYVOICE_ENV_PATH?.trim();
  const candidate = configuredPath ? path.resolve(configuredPath) : path.resolve(process.cwd(), "../holystudio/holyvoice/.env");
  try {
    const line = readFileSync(candidate, "utf8").split(/\r?\n/).find((value) => value.startsWith("FISH_API_KEY="));
    return line?.slice("FISH_API_KEY=".length).trim().replace(/^['"]|['"]$/g, "") || undefined;
  } catch { return undefined; }
}
import { readFileSync } from "node:fs";
import path from "node:path";
