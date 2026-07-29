import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { applySemanticLabels, type SemanticLabel } from "@/lib/course-blocks/semantic-labels";

const lecture = "引子。 Rain smells different. 这是解释。";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const sentenceStart = lecture.indexOf("Rain");
const labels: SemanticLabel[] = [
  { id: "block-001", type: "intro", start: 0, end: sentenceStart, textHash: hash("引子。 "), role: "teaching" },
  { id: "block-002", type: "sentence", start: sentenceStart, end: lecture.length, textHash: hash("Rain smells different. 这是解释。"), role: "original", sentenceId: "p01-s01" },
];

describe("immutable semantic labels", () => {
  it("creates blocks from exact ranges without changing their text", () => {
    const result = applySemanticLabels({ slug: "rain", title: "Rain", sourceHash: "source", finalLectureHash: "lecture", finalLecture: lecture }, labels);
    expect(result.blocks.map((block) => block.segments[0].text)).toEqual(["引子。 ", "Rain smells different. 这是解释。"]);
  });

  it("rejects gaps, overlaps, and text hashes that do not match", () => {
    expect(() => applySemanticLabels({ slug: "rain", title: "Rain", sourceHash: "source", finalLectureHash: "lecture", finalLecture: lecture }, [{ ...labels[0], end: labels[0].end - 1, textHash: hash("引子。") }, { ...labels[1], start: labels[1].start + 1, textHash: hash(lecture.slice(labels[1].start + 1)) }])).toThrow(/gap/);
    expect(() => applySemanticLabels({ slug: "rain", title: "Rain", sourceHash: "source", finalLectureHash: "lecture", finalLecture: lecture }, [{ ...labels[0], textHash: "wrong" }, labels[1]])).toThrow(/text hash/);
  });
});
