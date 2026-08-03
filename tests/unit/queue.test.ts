import { describe, expect, it } from "vitest";

import { buildGuidedQueue } from "@/features/reader/queue";

describe("guided playback queue", () => {
  it("derives all source sentences when one block explains multiple sentences", () => {
    const queue = buildGuidedQueue([{
      id: "block-multi", type: "bridge", sentenceId: "p01-s02", segments: [
        { language: "en", role: "original", text: "First. Second.", sourceSentenceIds: ["p01-s01", "p01-s02"] },
      ], audioPath: "/api/media/multi", audioStatus: "READY", audioDurationMs: 1800,
    }]);

    expect(queue[0]?.sentenceIds).toEqual(["p01-s01", "p01-s02"]);
  });

  it("carries timed source highlight cues with the matching audio block", () => {
    const queue = buildGuidedQueue([{
      id: "block-1", type: "sentence", sentenceId: "p01-s01", segments: [], audioPath: "/api/media/1", audioStatus: "READY", audioDurationMs: 1200,
      highlightCues: [{ id: "cue-1", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil", startMs: 520, endMs: 1040 }],
    }]);

    expect(queue[0]?.highlightCues).toEqual([{ id: "cue-1", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil", startMs: 520, endMs: 1040 }]);
  });
});
