import type { AudioStatus } from "@prisma/client";
import type { CourseImport } from "@/types/article";
import { normalize } from "./course-schema";

export type SentenceCoverageResult = { sentenceId: string; originalReadCovered: boolean; meaningCovered: boolean; depthAssigned: boolean; paragraphGuideAssigned: boolean; duplicateCoverageCount: number; errors: string[] };
export type QaResult = { blockingIssues: string[]; warnings: string[]; coverage: SentenceCoverageResult[] };

export function evaluateSentenceCoverage(course: CourseImport): SentenceCoverageResult[] {
  const guides = course.paragraphGuides.flatMap((guide) => guide.sentenceGuides);
  return course.paragraphs.flatMap((paragraph) => paragraph.sentences.map((sentence) => {
    const matches = guides.filter((guide) => guide.sentenceId === sentence.id);
    const guide = matches[0];
    const errors: string[] = [];
    if (!guide) errors.push("MISSING_GUIDE");
    if (guide && normalize(guide.originalReadText) !== normalize(sentence.text)) errors.push("ORIGINAL_TEXT_MISMATCH");
    if (guide && guide.paragraphId !== paragraph.id) errors.push("PARAGRAPH_MISMATCH");
    return { sentenceId: sentence.id, originalReadCovered: Boolean(guide?.originalReadText), meaningCovered: Boolean(guide?.meaningZh), depthAssigned: Boolean(guide?.depth), paragraphGuideAssigned: Boolean(guide), duplicateCoverageCount: matches.length, errors: [...errors, ...(matches.length > 1 ? ["DUPLICATE_COVERAGE"] : [])] };
  }));
}

export function evaluateQa({ course, audioStatuses }: { course: CourseImport; audioStatuses: AudioStatus[] }): QaResult {
  const coverage = evaluateSentenceCoverage(course);
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  if (coverage.some((item) => item.errors.length || !item.meaningCovered || !item.depthAssigned)) blockingIssues.push("INCOMPLETE_SENTENCE_COVERAGE");
  if (course.paragraphGuides.length !== course.paragraphs.length) blockingIssues.push("MISSING_PARAGRAPH_GUIDE");
  if (audioStatuses.some((status) => status === "STALE")) blockingIssues.push("STALE_AUDIO");
  if (audioStatuses.some((status) => status === "FAILED")) blockingIssues.push("FAILED_AUDIO");
  const deepCount = course.paragraphGuides.flatMap((guide) => guide.sentenceGuides).filter((sentence) => sentence.depth === "DEEP").length;
  if (deepCount < 3 || deepCount > 5) warnings.push("DEEP_SENTENCE_COUNT_OUT_OF_RANGE");
  return { blockingIssues, warnings, coverage };
}

export function findDuplicateCourseBodies(courses: Array<{ id: string; bodyText: string }>) {
  const seen = new Map<string, string>(); const duplicates: Array<{ id: string; matches: string }> = [];
  for (const course of courses) { const normalized = course.bodyText.replace(/\s+/g, " ").trim().toLowerCase(); const matches = seen.get(normalized); if (matches) duplicates.push({ id: course.id, matches }); else seen.set(normalized, course.id); }
  return duplicates;
}
