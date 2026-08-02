export type BlockType = "intro" | "title" | "sentence" | "bridge" | "recap" | "outro";
export type SegmentLanguage = "en" | "zh";
export type SegmentRole = "original" | "teaching" | "reread" | "quote" | "transition" | "recap" | "warmth";
export type AudioStatus = "ready" | "missing" | "failed";

export type CourseHighlightCue = {
  id: string;
  sentenceId?: string;
  sourceText: string;
  sourceStart: number;
  sourceEnd: number;
  spokenText: string;
  spokenOccurrence?: number;
  startMs?: number;
  endMs?: number;
};

export type CourseSubtitleCue = {
  id: string;
  text: string;
  language: SegmentLanguage;
  startMs: number;
  endMs: number;
};

export type CourseSegment = {
  language: SegmentLanguage;
  role: SegmentRole;
  text: string;
  sourceReferences?: string[];
  sourceSentenceIds?: string[];
  sourceHash?: string;
};

export type CourseBlock = {
  id: string;
  type: BlockType;
  segments: CourseSegment[];
  sentenceId?: string;
  sentenceIds?: string[];
  original?: string;
  title?: string;
  highlightCues?: CourseHighlightCue[];
  subtitleCues?: CourseSubtitleCue[];
};

export type CourseAudioMapping = {
  audioId: string;
  blockIds: string[];
  sentenceId?: string;
  path: string;
  durationMs: number;
  status: AudioStatus;
  scriptHash: string;
};

export type CourseDocument = {
  schemaVersion: 1;
  slug: string;
  title: string;
  sourceHash: string;
  finalLectureHash: string;
  blocks: CourseBlock[];
  audio: CourseAudioMapping[];
};
