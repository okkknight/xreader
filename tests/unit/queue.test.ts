import { describe, expect, it } from "vitest";

import { buildGuidedQueue, buildReadingQueue, mapSentenceToGuidedSegment } from "@/features/reader/queue";

const segments = [
  { id: "seg-1", order: 1, type: "OPENING", sentenceIds: ["s1"], audioStatus: "READY", audioPath: "a.wav" },
  { id: "seg-2", order: 2, type: "ARTICLE_READ", sentenceIds: ["s2"], audioStatus: "READY", audioPath: "b.wav" },
  { id: "seg-3", order: 3, type: "ARTICLE_READ", sentenceIds: ["s3"], audioStatus: "MISSING", audioPath: null },
];

describe("reader queue", () => {
  it("uses ready lesson segments for guided mode and reading segments for reading mode", () => {
    expect(buildGuidedQueue(segments).map((item) => item.id)).toEqual(["seg-1", "seg-2"]);
    expect(buildReadingQueue(segments).map((item) => item.id)).toEqual(["seg-2"]);
    expect(mapSentenceToGuidedSegment("s2", segments)).toBe("seg-2");
  });
});
