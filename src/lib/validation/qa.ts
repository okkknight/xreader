import type { AudioStatus } from "@prisma/client";

import type { CourseImport } from "@/types/article";

export type QaResult = {
  blockingIssues: string[];
  warnings: string[];
};

const explanationTypes = new Set(["QUICK_EXPLANATION", "NORMAL_EXPLANATION", "DEEP_EXPLANATION", "EXPRESSION_NOTE", "CONTEXT_CONNECTION", "REPLAY"]);

export function evaluateQa({ course, audioStatuses }: { course: CourseImport; audioStatuses: AudioStatus[] }): QaResult {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  if (audioStatuses.includes("STALE")) blockingIssues.push("STALE_AUDIO");
  if (audioStatuses.includes("FAILED")) blockingIssues.push("FAILED_AUDIO");
  if (course.lessonSegments.some((segment) => segment.type === "ARTICLE_READ" && segment.sentenceIds.length === 0)) {
    blockingIssues.push("BROKEN_SENTENCE_MAPPING");
  }

  const pauses = course.lessonSegments.filter((segment) => explanationTypes.has(segment.type)).length;
  if (pauses < 6 || pauses > 10) warnings.push("PAUSE_COUNT_OUT_OF_RANGE");

  const deepExplanations = course.lessonSegments.filter((segment) => segment.type === "DEEP_EXPLANATION").length;
  if (deepExplanations < 3 || deepExplanations > 4) warnings.push("DEEP_EXPLANATION_COUNT_OUT_OF_RANGE");

  const expressions = course.lessonSegments.filter((segment) => segment.type === "EXPRESSION_NOTE").length;
  if (expressions < 4 || expressions > 6) warnings.push("EXPRESSION_COUNT_OUT_OF_RANGE");

  return { blockingIssues, warnings };
}

export function findDuplicateCourseBodies(courses: Array<{ id: string; bodyText: string }>) {
  const seen = new Map<string, string>();
  const duplicates: Array<{ id: string; matches: string }> = [];
  for (const course of courses) {
    const normalized = course.bodyText.replace(/\s+/g, " ").trim().toLowerCase();
    const matches = seen.get(normalized);
    if (matches) duplicates.push({ id: course.id, matches }); else seen.set(normalized, course.id);
  }
  return duplicates;
}
