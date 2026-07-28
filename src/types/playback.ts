export type PlaybackItem = { id: string; sentenceIds: string[]; audioPath: string };

export type PlaybackState = {
  mode: "GUIDED" | "READING";
  activeItemId?: string;
  playing: boolean;
  autoFollow: boolean;
  rate: number;
  completed: boolean;
};
