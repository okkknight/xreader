import type { PlaybackItem } from "@/types/playback";
import type { PublicCourseBlock, PublicSentence } from "@/types/public-article";

export function buildGuidedQueue(blocks: PublicCourseBlock[]) {
  return blocks.filter((block) => block.audioStatus === "READY" && block.audioPath).map((block): PlaybackItem => ({ id: block.id, sentenceIds: block.sentenceIds ?? (block.sentenceId ? [block.sentenceId] : []), audioPath: block.audioPath!, ...(block.highlightCues?.length ? { highlightCues: block.highlightCues } : {}) }));
}

export function buildReadingQueue(sentences: PublicSentence[]) {
  return sentences.filter((sentence) => sentence.audioStatus === "READY" && sentence.audioPath).map((sentence): PlaybackItem => ({ id: sentence.id, sentenceIds: [sentence.id], audioPath: sentence.audioPath! }));
}

export function mapSentenceToGuidedBlock(sentenceId: string, blocks: PublicCourseBlock[]) {
  return buildGuidedQueue(blocks).find((block) => block.sentenceIds.includes(sentenceId))?.id;
}
