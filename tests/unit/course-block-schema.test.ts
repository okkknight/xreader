import { describe, expect, it } from "vitest";
import { courseDocumentSchema, type CourseDocument } from "@/lib/course-blocks/schema";

const document: CourseDocument = {
  schemaVersion: 1,
  slug: "rain",
  title: "Why Does Rain Have a Smell?",
  sourceHash: "source-hash",
  finalLectureHash: "lecture-hash",
  blocks: [
    { id: "block-001", type: "intro", segments: [{ language: "zh", role: "teaching", text: "有时雨还没落下，空气先变了。" }] },
    { id: "block-002", type: "title", original: "Why Does Rain Have a Smell?", segments: [{ language: "en", role: "original", text: "Why Does Rain Have a Smell?" }] },
    { id: "block-003", type: "sentence", sentenceId: "p1-s1", original: "Rain smells different.", segments: [{ language: "en", role: "original", text: "Rain smells different." }, { language: "zh", role: "teaching", text: "雨的气味不同。" }] },
    { id: "block-004", type: "bridge", segments: [{ language: "zh", role: "transition", text: "现在继续看原因。" }] },
    { id: "block-005", type: "recap", segments: [{ language: "zh", role: "recap", text: "刚才的过程连起来了。" }] },
    { id: "block-006", type: "outro", segments: [{ language: "zh", role: "warmth", text: "文章读完了。" }] },
  ],
  audio: [{ audioId: "audio-001", blockIds: ["block-001", "block-002"], path: "audio/audio-001.wav", durationMs: 1000, status: "ready", scriptHash: "script-hash" }],
};

describe("Course Block schema", () => {
  it("accepts all supported block types and audio mappings", () => {
    expect(courseDocumentSchema.parse(document)).toEqual(document);
  });

  it("rejects a sentence block without its stable sentence anchor", () => {
    expect(() => courseDocumentSchema.parse({ ...document, blocks: [{ ...document.blocks[2], sentenceId: undefined }] })).toThrow();
  });

  it("rejects audio mapped to an unknown block", () => {
    expect(() => courseDocumentSchema.parse({ ...document, audio: [{ ...document.audio[0], blockIds: ["missing"] }] })).toThrow(/unknown block/);
  });

  it("rejects declared source references without timed highlight cues", () => {
    const block = { ...document.blocks[2]!, segments: [{ language: "en" as const, role: "original" as const, text: "Rain smells different.", sourceReferences: ["Rain"] }] };
    expect(() => courseDocumentSchema.parse({ ...document, blocks: [document.blocks[0]!, document.blocks[1]!, block, ...document.blocks.slice(3)] })).toThrow(/highlight cues/);
  });
});
