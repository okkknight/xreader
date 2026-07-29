import { createHash } from "node:crypto";
import { courseDocumentSchema } from "./schema";
import type { BlockType, CourseDocument, SegmentRole } from "./types";

export type SemanticLabel = {
  id: string;
  type: BlockType;
  start: number;
  end: number;
  textHash: string;
  role: SegmentRole;
  sentenceId?: string;
};

function textHash(text: string) { return createHash("sha256").update(text).digest("hex"); }

export function applySemanticLabels(input: { slug: string; title: string; sourceHash: string; finalLectureHash: string; finalLecture: string }, labels: SemanticLabel[]): CourseDocument {
  const ordered = [...labels].sort((a, b) => a.start - b.start);
  if (ordered.length === 0 || ordered[0].start !== 0) throw new Error("semantic labels contain a gap at the beginning");
  for (let index = 0; index < ordered.length; index += 1) {
    const label = ordered[index];
    if (!Number.isInteger(label.start) || !Number.isInteger(label.end) || label.start < 0 || label.end <= label.start || label.end > input.finalLecture.length) throw new Error(`invalid semantic label range: ${label.id}`);
    const previous = ordered[index - 1];
    if (previous && label.start < previous.end) throw new Error(`semantic labels overlap: ${label.id}`);
    if (previous && label.start > previous.end) throw new Error(`semantic labels contain a gap before: ${label.id}`);
    const text = input.finalLecture.slice(label.start, label.end);
    if (textHash(text) !== label.textHash) throw new Error(`semantic label text hash mismatch: ${label.id}`);
  }
  if (ordered.at(-1)!.end !== input.finalLecture.length) throw new Error("semantic labels contain a gap at the end");
  return courseDocumentSchema.parse({
    schemaVersion: 1,
    slug: input.slug,
    title: input.title,
    sourceHash: input.sourceHash,
    finalLectureHash: input.finalLectureHash,
    blocks: ordered.map((label) => ({ id: label.id, type: label.type, sentenceId: label.sentenceId, ...(label.type === "title" ? { original: input.title } : {}), segments: [{ language: label.role === "original" || label.role === "reread" ? "en" : "zh", role: label.role, text: input.finalLecture.slice(label.start, label.end), ...(label.sentenceId ? { sourceSentenceIds: [label.sentenceId] } : {}) }] })),
    audio: [],
  });
}
