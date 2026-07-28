import { describe, expect, it } from "vitest";

import { getFishAudioConfig } from "@/lib/audio/config";

describe("getFishAudioConfig", () => {
  it("requires a server-side API key and preserves model configuration", () => {
    expect(() => getFishAudioConfig({})).toThrow("FISH_AUDIO_API_KEY");
    expect(getFishAudioConfig({
      FISH_AUDIO_API_KEY: "key",
      FISH_AUDIO_MODEL: "model",
      FISH_TEACHER_REFERENCE_ID: "teacher",
      FISH_READER_REFERENCE_ID: "reader",
      AUDIO_STORAGE_DIR: "data/audio",
    })).toMatchObject({ apiKey: "key", model: "model", teacherReferenceId: "teacher", readerReferenceId: "reader" });
  });
});
