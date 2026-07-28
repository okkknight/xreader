import type { PlaybackItem } from "@/types/playback";

type QueueSegment = { id: string; order: number; type: string; sentenceIds: unknown; audioStatus: string; audioPath: string | null };

function readyItems(segments: QueueSegment[]) {
  return segments
    .filter((segment) => segment.audioStatus === "READY" && segment.audioPath)
    .sort((a, b) => a.order - b.order)
    .map((segment): PlaybackItem => ({ id: segment.id, sentenceIds: Array.isArray(segment.sentenceIds) ? segment.sentenceIds.filter((id): id is string => typeof id === "string") : [], audioPath: segment.audioPath! }));
}

export function buildGuidedQueue(segments: QueueSegment[]) { return readyItems(segments); }
export function buildReadingQueue(segments: QueueSegment[]) { return readyItems(segments.filter((segment) => segment.type === "ARTICLE_READ")); }
export function mapSentenceToGuidedSegment(sentenceId: string, segments: QueueSegment[]) {
  return buildGuidedQueue(segments).find((segment) => segment.sentenceIds.includes(sentenceId))?.id;
}
