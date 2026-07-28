import { z } from "zod";

const articleStatuses = ["IDEA", "SOURCED", "ARTICLE_DRAFT", "ARTICLE_EDITED", "ANALYZED", "DIRECTED", "SCRIPTED", "AUDIO_READY", "QA_PASSED", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
const segmentTypes = ["OPENING", "ORIENTATION", "ARTICLE_READ", "QUICK_EXPLANATION", "NORMAL_EXPLANATION", "DEEP_EXPLANATION", "EXPRESSION_NOTE", "CONTEXT_CONNECTION", "REPLAY", "SECTION_SUMMARY", "FINAL_WRAP"] as const;

const sentenceSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  text: z.string().min(1),
  translationZh: z.string().min(1).optional(),
});

const paragraphSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  text: z.string().min(1),
  sentences: z.array(sentenceSchema).min(1),
});

const segmentSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  type: z.enum(segmentTypes),
  voiceRole: z.enum(["TEACHER", "READER"]),
  sentenceIds: z.array(z.string().min(1)),
  script: z.string().min(1).optional(),
  primaryGoal: z.string().min(1).optional(),
});

export const courseSchema = z.object({
  article: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    titleEn: z.string().min(1),
    titleZh: z.string().min(1),
    dekZh: z.string().min(1).optional(),
    topic: z.string().min(1),
    difficulty: z.string().min(1),
    status: z.enum(articleStatuses),
    publishedAt: z.date().optional(),
    scheduledAt: z.date().optional(),
  }),
  paragraphs: z.array(paragraphSchema).min(1),
  lessonSegments: z.array(segmentSchema).min(1),
  annotations: z.array(z.object({
    id: z.string().min(1),
    sentenceId: z.string().min(1),
    startOffset: z.number().int().nonnegative(),
    endOffset: z.number().int().positive(),
    text: z.string().min(1),
    meaningZh: z.string().min(1),
    noteZh: z.string().min(1).optional(),
    exampleEn: z.string().min(1).optional(),
  })),
}).superRefine((course, context) => {
  const sentenceIds = course.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => sentence.id));
  if (new Set(sentenceIds).size !== sentenceIds.length) {
    context.addIssue({ code: "custom", message: "duplicate sentence ID" });
  }

  const segmentOrders = course.lessonSegments.map((segment) => segment.order).sort((a, b) => a - b);
  if (!segmentOrders.every((order, index) => order === index + 1)) {
    context.addIssue({ code: "custom", message: "lesson segment orders must be contiguous" });
  }

  for (const segment of course.lessonSegments) {
    if (segment.type === "ARTICLE_READ" && segment.sentenceIds.length === 0) {
      context.addIssue({ code: "custom", message: "ARTICLE_READ requires sentence IDs" });
    }
    if (segment.voiceRole === "TEACHER" && !segment.script) {
      context.addIssue({ code: "custom", message: "teacher segments require a script" });
    }
    for (const sentenceId of segment.sentenceIds) {
      if (!sentenceIds.includes(sentenceId)) {
        context.addIssue({ code: "custom", message: `lesson segment references unknown sentence ID: ${sentenceId}` });
      }
    }
  }

  for (const annotation of course.annotations) {
    if (!sentenceIds.includes(annotation.sentenceId)) {
      context.addIssue({ code: "custom", message: `annotation references unknown sentence ID: ${annotation.sentenceId}` });
    }
  }
});

export type ValidatedCourse = z.infer<typeof courseSchema>;

export function validateCourse(input: unknown): ValidatedCourse {
  return courseSchema.parse(input);
}
