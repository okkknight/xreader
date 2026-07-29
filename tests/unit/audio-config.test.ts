import { describe, expect, it } from "vitest";

import { getFishAudioConfig } from "@/lib/audio/config";

describe("getFishAudioConfig", () => {
  it("requires a server-side API key and preserves model configuration", () => {
    expect(() => getFishAudioConfig({ FISH_AUDIO_API_KEY: "" })).toThrow("FISH_AUDIO_API_KEY");
    expect(getFishAudioConfig({
      FISH_AUDIO_API_KEY: "key",
      FISH_AUDIO_MODEL: "model",
      FISH_TEACHER_REFERENCE_ID: "teacher",
      FISH_READER_REFERENCE_ID: "reader",
      AUDIO_STORAGE_DIR: "data/audio",
    })).toMatchObject({ apiKey: "key", model: "model", teacherReferenceId: "teacher", readerReferenceId: "reader" });
  });

  it("uses the selected teacher voice by default", () => {
    expect(getFishAudioConfig({ FISH_AUDIO_API_KEY: "key" })).toMatchObject({
      teacherReferenceId: "a19fd22b105a423a8c5ae5294b0353df",
      readerReferenceId: "76fcd904aa4b4a47af107686abd68248",
    });
  });
});
