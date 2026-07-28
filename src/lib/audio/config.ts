export type FishAudioConfig = {
  apiKey: string;
  model: string;
  teacherReferenceId: string;
  readerReferenceId: string;
  storageDir: string;
};

export function getFishAudioConfig(env: NodeJS.ProcessEnv = process.env): FishAudioConfig {
  const apiKey = env.FISH_AUDIO_API_KEY?.trim();
  if (!apiKey) throw new Error("FISH_AUDIO_API_KEY is required for Fish Audio generation");

  return {
    apiKey,
    model: env.FISH_AUDIO_MODEL?.trim() || "s2.1-pro-free",
    teacherReferenceId: env.FISH_TEACHER_REFERENCE_ID?.trim() || "",
    readerReferenceId: env.FISH_READER_REFERENCE_ID?.trim() || "",
    storageDir: env.AUDIO_STORAGE_DIR?.trim() || "data/audio",
  };
}
