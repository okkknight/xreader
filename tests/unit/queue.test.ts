import { describe, expect, it } from "vitest";

import { buildGuidedQueue, buildReadingQueue, mapSentenceToGuidedParagraph } from "@/features/reader/queue";

const guides = [
  { id: "guide-1", order: 1, sentenceGuides: [{ sentenceId: "s1", estimatedStartMs: 0, estimatedEndMs: 500 }, { sentenceId: "s2", estimatedStartMs: 500, estimatedEndMs: 1000 }], audioStatus: "READY", audioPath: "a.wav" },
  { id: "guide-2", order: 2, sentenceGuides: [{ sentenceId: "s3", estimatedStartMs: 0, estimatedEndMs: 500 }], audioStatus: "MISSING", audioPath: null },
];
const sentences = [{ id: "s1", audioStatus: "MISSING", audioPath: null }, { id: "s2", audioStatus: "READY", audioPath: "b.wav" }];

describe("reader queue", () => {
  it("uses ready lesson segments for guided mode and reading segments for reading mode", () => {
    expect(buildGuidedQueue(guides).map((item) => item.id)).toEqual(["guide-1"]);
    expect(buildReadingQueue(sentences).map((item) => item.id)).toEqual(["s2"]);
    expect(mapSentenceToGuidedParagraph("s2", guides)).toBe("guide-1");
  });
});
