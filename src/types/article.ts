import type { ArticleStatus, GuideDepth } from "@prisma/client";

export type GuideDepthInput = GuideDepth;

export type SentenceInput = {
  id: string;
  order: number;
  text: string;
  translationZh?: string;
};

export type ParagraphInput = {
  id: string;
  order: number;
  text: string;
  sentences: SentenceInput[];
};

export type SentenceGuideInput = {
  id: string;
  paragraphId: string;
  sentenceId: string;
  order: number;
  depth: GuideDepthInput;
  originalReadText: string;
  meaningZh: string;
  sentenceFunction: string;
  primaryTeachingGoal: string;
  focusScript?: string;
  bridgeScript?: string;
  likelyMisunderstanding?: string;
  expressionTarget?: string;
  replayAfterExplanation?: boolean;
  estimatedStartMs?: number;
  estimatedEndMs?: number;
};

export type ParagraphGuideInput = {
  id: string;
  paragraphId: string;
  order: number;
  paragraphGoal: string;
  openingBridge?: string;
  paragraphWrap?: string;
  nextParagraphBridge?: string;
  scriptText: string;
  sentenceGuides: SentenceGuideInput[];
  audioPath?: string;
  audioDurationMs?: number;
  audioStatus?: "MISSING" | "QUEUED" | "GENERATING" | "READY" | "STALE" | "FAILED";
  textHash?: string;
};

export type AnnotationInput = {
  id: string;
  sentenceId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  meaningZh: string;
  noteZh?: string;
  exampleEn?: string;
};

export type CourseImport = {
  article: {
    id: string;
    slug: string;
    titleEn: string;
    titleZh: string;
    dekZh?: string;
    topic: string;
    difficulty: string;
    status: ArticleStatus;
    publishedAt?: Date;
    scheduledAt?: Date;
  };
  paragraphs: ParagraphInput[];
  paragraphGuides: ParagraphGuideInput[];
  annotations: AnnotationInput[];
};
