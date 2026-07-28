export type PlaybackItem = { id: string; sentenceIds: string[]; audioPath: string; sentenceRanges?: Array<{ sentenceId: string; startMs: number; endMs: number }> };

export type PlaybackState = {
  mode: "GUIDED" | "READING";
  activeItemId?: string;
  playing: boolean;
  autoFollow: boolean;
  rate: number;
  completed: boolean;
};
