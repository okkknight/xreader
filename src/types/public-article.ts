import type { BlockType, CourseHighlightCue, CourseSegment, CourseSubtitleCue } from "@/lib/course-blocks/types";

export type PublicAnnotation = { id: string; text: string; meaningZh: string; noteZh: string | null; exampleEn: string | null };
export type PublicSentence = { id: string; text: string; translationZh: string | null; annotations: PublicAnnotation[]; audioPath: string | null; audioStatus: string };
export type PublicParagraph = { id: string; text: string; sentences: PublicSentence[] };
export type PublicCourseBlock = {
  id: string;
  type: BlockType;
  title?: string;
  sentenceId?: string;
  sentenceIds?: string[];
  original?: string;
  highlightCues?: CourseHighlightCue[];
  subtitleCues?: CourseSubtitleCue[];
  segments: CourseSegment[];
  audioPath: string | null;
  audioStatus: string;
  audioDurationMs: number | null;
};
export type PublicArticle = {
  id: string; slug: string; titleEn: string; titleZh: string; dekZh: string | null; topic: string; difficulty: string;
  publishedAt?: string | null;
  paragraphs: PublicParagraph[]; courseBlocks: PublicCourseBlock[];
};
