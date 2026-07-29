import type { CourseHighlightCue } from "@/lib/course-blocks/types";

export type PlaybackItem = { id: string; sentenceIds: string[]; audioPath: string; sentenceRanges?: Array<{ sentenceId: string; startMs: number; endMs: number }>; highlightCues?: CourseHighlightCue[] };

export type PlaybackState = {
  mode: "GUIDED" | "READING";
  activeItemId?: string;
  activeSentenceId?: string;
  playing: boolean;
  autoFollow: boolean;
  rate: number;
  completed: boolean;
};
