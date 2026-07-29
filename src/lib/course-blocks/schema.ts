import { z } from "zod";
import type { CourseDocument } from "./types";

const segmentSchema = z.object({
  language: z.enum(["en", "zh"]),
  role: z.enum(["original", "teaching", "reread", "quote", "transition", "recap", "warmth"]),
  text: z.string().min(1),
  sourceReferences: z.array(z.string().min(1)).optional(),
  sourceSentenceIds: z.array(z.string().min(1)).optional(),
  sourceHash: z.string().min(1).optional(),
});

const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["intro", "title", "sentence", "bridge", "recap", "outro"]),
  segments: z.array(segmentSchema).min(1),
  sentenceId: z.string().min(1).optional(),
  sentenceIds: z.array(z.string().min(1)).optional(),
  original: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  highlightCues: z.array(z.object({
    id: z.string().min(1),
    sourceText: z.string().min(1),
    sourceStart: z.number().int().nonnegative(),
    sourceEnd: z.number().int().positive(),
    spokenText: z.string().min(1),
    spokenOccurrence: z.number().int().nonnegative().optional(),
    startMs: z.number().int().nonnegative().optional(),
    endMs: z.number().int().positive().optional(),
  })).optional(),
  subtitleCues: z.array(z.object({
    id: z.string().min(1),
    text: z.string().min(1),
    language: z.enum(["en", "zh"]),
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().positive(),
  })).optional(),
});

const audioSchema = z.object({
  audioId: z.string().min(1),
  blockIds: z.array(z.string().min(1)),
  sentenceId: z.string().min(1).optional(),
  path: z.string().min(1),
  durationMs: z.number().int().positive(),
  status: z.enum(["ready", "missing", "failed"]),
  scriptHash: z.string().min(1),
});

export const courseDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  sourceHash: z.string().min(1),
  finalLectureHash: z.string().min(1),
  blocks: z.array(blockSchema).min(1),
  audio: z.array(audioSchema),
}).superRefine((document, context) => {
  const blockIds = new Set(document.blocks.map((block) => block.id));
  if (blockIds.size !== document.blocks.length) context.addIssue({ code: "custom", message: "duplicate block ID" });
  for (const audio of document.audio) {
    if (!audio.blockIds.length && !audio.sentenceId) context.addIssue({ code: "custom", message: "audio mapping requires a block or sentence owner" });
    if (audio.blockIds.length && audio.sentenceId) context.addIssue({ code: "custom", message: "audio mapping cannot mix block and sentence owners" });
    for (const blockId of audio.blockIds) {
      if (!blockIds.has(blockId)) context.addIssue({ code: "custom", message: `unknown block in audio mapping: ${blockId}` });
    }
  }
  for (const [index, block] of document.blocks.entries()) {
    if (block.type === "sentence" && !block.sentenceId) context.addIssue({ code: "custom", path: ["blocks", index, "sentenceId"], message: "sentence block requires sentenceId" });
    if (block.type !== "sentence" && block.sentenceId) context.addIssue({ code: "custom", path: ["blocks", index, "sentenceId"], message: "only sentence blocks may have sentenceId" });
    const sourceReferences = block.segments.flatMap((segment) => segment.sourceReferences ?? []);
    if (sourceReferences.length && !block.highlightCues?.length) context.addIssue({ code: "custom", path: ["blocks", index, "highlightCues"], message: "source references require highlight cues" });
  }
});

export type { CourseDocument };
