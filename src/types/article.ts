import type {
  ArticleStatus,
  SegmentType,
  VoiceRole,
} from "@prisma/client";

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

export type LessonSegmentInput = {
  id: string;
  order: number;
  type: SegmentType;
  voiceRole: VoiceRole;
  sentenceIds: string[];
  script?: string;
  primaryGoal?: string;
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
  lessonSegments: LessonSegmentInput[];
  annotations: AnnotationInput[];
};
