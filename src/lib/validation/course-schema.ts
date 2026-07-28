import { z } from "zod";

const articleStatuses = ["IDEA", "SOURCED", "ARTICLE_DRAFT", "ARTICLE_EDITED", "ANALYZED", "DIRECTED", "SCRIPTED", "AUDIO_READY", "QA_PASSED", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
const depths = ["QUICK", "NORMAL", "DEEP"] as const;

const sentenceSchema = z.object({ id: z.string().min(1), order: z.number().int().positive(), text: z.string().min(1), translationZh: z.string().min(1).optional() });
const paragraphSchema = z.object({ id: z.string().min(1), order: z.number().int().positive(), text: z.string().min(1), sentences: z.array(sentenceSchema).min(1) });
const sentenceGuideSchema = z.object({
  id: z.string().min(1), paragraphId: z.string().min(1), sentenceId: z.string().min(1), order: z.number().int().positive(), depth: z.enum(depths),
  originalReadText: z.string().min(1), meaningZh: z.string().min(1), sentenceFunction: z.string().min(1), primaryTeachingGoal: z.string().min(1),
  focusScript: z.string().min(1).optional(), bridgeScript: z.string().min(1).optional(), likelyMisunderstanding: z.string().min(1).optional(), expressionTarget: z.string().min(1).optional(), replayAfterExplanation: z.boolean().optional(), estimatedStartMs: z.number().int().nonnegative().optional(), estimatedEndMs: z.number().int().positive().optional(),
});
const paragraphGuideSchema = z.object({
  id: z.string().min(1), paragraphId: z.string().min(1), order: z.number().int().positive(), paragraphGoal: z.string().min(1), openingBridge: z.string().min(1).optional(), paragraphWrap: z.string().min(1).optional(), nextParagraphBridge: z.string().min(1).optional(), scriptText: z.string().min(1), sentenceGuides: z.array(sentenceGuideSchema).min(1), audioPath: z.string().optional(), audioDurationMs: z.number().int().positive().optional(), audioStatus: z.enum(["MISSING", "QUEUED", "GENERATING", "READY", "STALE", "FAILED"]).optional(), textHash: z.string().optional(),
});

export const courseSchema = z.object({
  article: z.object({ id: z.string().min(1), slug: z.string().min(1), titleEn: z.string().min(1), titleZh: z.string().min(1), dekZh: z.string().min(1).optional(), topic: z.string().min(1), difficulty: z.string().min(1), status: z.enum(articleStatuses), publishedAt: z.date().optional(), scheduledAt: z.date().optional() }),
  paragraphs: z.array(paragraphSchema).min(1),
  paragraphGuides: z.array(paragraphGuideSchema).min(1),
  annotations: z.array(z.object({ id: z.string().min(1), sentenceId: z.string().min(1), startOffset: z.number().int().nonnegative(), endOffset: z.number().int().positive(), text: z.string().min(1), meaningZh: z.string().min(1), noteZh: z.string().min(1).optional(), exampleEn: z.string().min(1).optional() })),
}).superRefine((course, context) => {
  const paragraphsById = new Map(course.paragraphs.map((paragraph) => [paragraph.id, paragraph]));
  const sentences = course.paragraphs.flatMap((paragraph) => paragraph.sentences);
  const sentencesById = new Map(sentences.map((sentence) => [sentence.id, sentence]));
  if (sentencesById.size !== sentences.length) context.addIssue({ code: "custom", message: "duplicate sentence ID" });
  const guideOrders = course.paragraphGuides.map((guide) => guide.order).sort((a, b) => a - b);
  if (!guideOrders.every((order, index) => order === index + 1)) context.addIssue({ code: "custom", message: "paragraph guide orders must be contiguous" });
  if (new Set(course.paragraphGuides.map((guide) => guide.paragraphId)).size !== course.paragraphGuides.length) context.addIssue({ code: "custom", message: "each paragraph must have one guide" });
  for (const guide of course.paragraphGuides) {
    const paragraph = paragraphsById.get(guide.paragraphId);
    if (!paragraph) { context.addIssue({ code: "custom", message: `guide references unknown paragraph ID: ${guide.paragraphId}` }); continue; }
    if (guide.sentenceGuides.length !== paragraph.sentences.length) context.addIssue({ code: "custom", message: `paragraph ${guide.paragraphId} does not cover every sentence` });
    const seen = new Set<string>();
    for (const sentenceGuide of guide.sentenceGuides) {
      const sentence = sentencesById.get(sentenceGuide.sentenceId);
      if (!sentence) { context.addIssue({ code: "custom", message: `guide references unknown sentence ID: ${sentenceGuide.sentenceId}` }); continue; }
      if (sentenceGuide.paragraphId !== guide.paragraphId) context.addIssue({ code: "custom", message: `sentence guide paragraph mismatch: ${sentenceGuide.sentenceId}` });
      if (seen.has(sentenceGuide.sentenceId)) context.addIssue({ code: "custom", message: `duplicate sentence coverage: ${sentenceGuide.sentenceId}` });
      seen.add(sentenceGuide.sentenceId);
      if (normalize(sentenceGuide.originalReadText) !== normalize(sentence.text)) context.addIssue({ code: "custom", message: `originalReadText mismatch: ${sentenceGuide.sentenceId}` });
    }
    for (const sentence of paragraph.sentences) if (!seen.has(sentence.id)) context.addIssue({ code: "custom", message: `missing sentence coverage: ${sentence.id}` });
  }
  for (const annotation of course.annotations) if (!sentencesById.has(annotation.sentenceId)) context.addIssue({ code: "custom", message: `annotation references unknown sentence ID: ${annotation.sentenceId}` });
});

export type ValidatedCourse = z.infer<typeof courseSchema>;
export function normalize(value: string) { return value.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim().toLowerCase(); }
export function validateCourse(input: unknown): ValidatedCourse { return courseSchema.parse(input); }
