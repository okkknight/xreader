import type { PlaybackItem } from "@/types/playback";

type GuidedParagraph = { id: string; order: number; sentenceGuides: Array<{ sentenceId: string; estimatedStartMs: number | null; estimatedEndMs: number | null }>; audioStatus: string; audioPath: string | null };
type ReadingSentence = { id: string; audioStatus: string; audioPath: string | null };

export function buildGuidedQueue(guides: GuidedParagraph[]) {
  return guides.filter((guide) => guide.audioStatus === "READY" && guide.audioPath).sort((a, b) => a.order - b.order).map((guide): PlaybackItem => ({ id: guide.id, sentenceIds: guide.sentenceGuides.map((sentence) => sentence.sentenceId), audioPath: guide.audioPath!, sentenceRanges: guide.sentenceGuides.map((sentence) => ({ sentenceId: sentence.sentenceId, startMs: sentence.estimatedStartMs ?? 0, endMs: sentence.estimatedEndMs ?? Number.POSITIVE_INFINITY })) }));
}

export function buildReadingQueue(sentences: ReadingSentence[]) {
  return sentences.filter((sentence) => sentence.audioStatus === "READY" && sentence.audioPath).map((sentence): PlaybackItem => ({ id: sentence.id, sentenceIds: [sentence.id], audioPath: sentence.audioPath! }));
}

export function mapSentenceToGuidedParagraph(sentenceId: string, guides: GuidedParagraph[]) {
  return buildGuidedQueue(guides).find((guide) => guide.sentenceIds.includes(sentenceId))?.id;
}
