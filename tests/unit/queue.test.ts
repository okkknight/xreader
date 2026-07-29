import { describe, expect, it } from "vitest";

import { buildGuidedQueue } from "@/features/reader/queue";

describe("guided playback queue", () => {
  it("carries timed source highlight cues with the matching audio block", () => {
    const queue = buildGuidedQueue([{
      id: "block-1", type: "sentence", sentenceId: "p01-s01", segments: [], audioPath: "/api/media/1", audioStatus: "READY", audioDurationMs: 1200,
      highlightCues: [{ id: "cue-1", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil", startMs: 520, endMs: 1040 }],
    }]);

    expect(queue[0]?.highlightCues).toEqual([{ id: "cue-1", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil", startMs: 520, endMs: 1040 }]);
  });
});
