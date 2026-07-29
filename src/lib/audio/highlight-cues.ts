import type { CourseBlock, CourseHighlightCue } from "@/lib/course-blocks/types";
import { sourceReferencePhrases } from "@/lib/reader/source-references";
import { wordsEquivalent } from "@/lib/reader/word-forms";

export type AlignmentSegment = { text: string; startMs: number; endMs: number };
export type TimedHighlightCue = CourseHighlightCue & Required<Pick<CourseHighlightCue, "startMs" | "endMs">>;
const words = (text: string) => text.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)?/gu) ?? [];
const englishWordRanges = (text: string) => [...text.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g)].map((match) => ({ value: match[0], start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }));

export function activeHighlightCuesAtTime(cues: CourseHighlightCue[], currentTimeMs: number) {
  const timedCues = cues.filter((cue): cue is TimedHighlightCue => cue.startMs !== undefined && cue.endMs !== undefined);
  const latestTeachingCue = timedCues
    .filter((cue) => !cue.id.endsWith("-original-read") && currentTimeMs >= cue.startMs)
    .sort((a, b) => a.startMs - b.startMs)
    .at(-1);

  if (latestTeachingCue) return [latestTeachingCue];

  return timedCues.filter((cue) => cue.id.endsWith("-original-read") && currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs);
}

function sourcePhraseRange(sourceText: string, spokenText: string) {
  const exactStart = sourceText.toLocaleLowerCase().indexOf(spokenText.toLocaleLowerCase());
  if (exactStart >= 0) return { start: exactStart, end: exactStart + spokenText.length };
  const sourceWords = englishWordRanges(sourceText);
  const spokenWords = englishWordRanges(spokenText).map((word) => word.value);
  if (!spokenWords.length) return undefined;
  for (let start = 0; start <= sourceWords.length - spokenWords.length; start += 1) {
    const matches = spokenWords.every((spokenWord, offset) => wordsEquivalent(sourceWords[start + offset].value, spokenWord));
    if (matches) return { start: sourceWords[start].start, end: sourceWords[start + spokenWords.length - 1].end };
  }
  return undefined;
}

function compatiblePhraseOccurrences(text: string, phrase: string) {
  const textWords = englishWordRanges(text).map((word) => word.value);
  const phraseWords = englishWordRanges(phrase).map((word) => word.value);
  if (!phraseWords.length) return 0;
  let count = 0;
  for (let start = 0; start <= textWords.length - phraseWords.length; start += 1) {
    if (phraseWords.every((word, offset) => wordsEquivalent(textWords[start + offset], word))) count += 1;
  }
  return count;
}

export function ensureBlockHighlightCues(block: CourseBlock, sourceSentenceById: Map<string, string>, courseTitle?: string): CourseHighlightCue[] {
  const authoredCues = block.highlightCues?.filter((cue) => !cue.id.endsWith("-original-read")) ?? [];
  const sourceText = block.sentenceId ? sourceSentenceById.get(block.sentenceId) : block.type === "title" ? block.original ?? courseTitle : undefined;
  if (!sourceText) return authoredCues;
  const originalReadCue: CourseHighlightCue = {
    id: `${block.id}-original-read`,
    sourceText,
    sourceStart: 0,
    sourceEnd: sourceText.length,
    spokenText: sourceText,
    spokenOccurrence: 0,
  };
  const teaching = block.segments.flatMap((segment) => segment.text.split(/\n\s*\n/).filter((part, index) => !(index === 0 && part.trim() === sourceText)).map((part) => part.trim())).filter(Boolean).join("\n\n");
  const teachingCues = sourceReferencePhrases(teaching, sourceText).flatMap((spokenText, index) => {
    const sourceRange = sourcePhraseRange(sourceText, spokenText);
    const spokenIndex = block.segments.map((segment) => segment.text).join(" ").toLocaleLowerCase().indexOf(spokenText.toLocaleLowerCase(), sourceText.length);
    if (!sourceRange || spokenIndex < 0) return [];
    const before = block.segments.map((segment) => segment.text).join(" ").slice(0, spokenIndex);
    const spokenOccurrence = compatiblePhraseOccurrences(before, spokenText);
    return [{ id: `${block.id}-teaching-${index + 1}`, sourceText: sourceText.slice(sourceRange.start, sourceRange.end), sourceStart: sourceRange.start, sourceEnd: sourceRange.end, spokenText, spokenOccurrence }];
  });
  const missingTeachingCues = teachingCues.filter((generatedCue) => !authoredCues.some((authoredCue) => authoredCue.sourceStart === generatedCue.sourceStart && authoredCue.sourceEnd === generatedCue.sourceEnd));
  return [originalReadCue, ...authoredCues, ...missingTeachingCues];
}

export function resolveHighlightCueTimings(alignment: AlignmentSegment[], cues: CourseHighlightCue[]): TimedHighlightCue[] {
  const alignedText = alignment.map((segment) => ({ segment, normalized: words(segment.text).join("") })).filter((entry) => entry.normalized.length);
  const stream = alignedText.map((entry) => entry.normalized).join("");
  const timeAt = (position: number, boundary: "start" | "end") => {
    let cursor = 0;
    for (let index = 0; index < alignedText.length; index += 1) {
      const entry = alignedText[index];
      const end = cursor + entry.normalized.length;
      if ((boundary === "start" ? position < end : position <= end) || index === alignedText.length - 1) return Math.round(entry.segment.startMs + ((position - cursor) / entry.normalized.length) * (entry.segment.endMs - entry.segment.startMs));
      cursor = end;
    }
    return alignedText.at(-1)!.segment.endMs;
  };
  return cues.map((cue) => {
    const targets = [...new Set([words(cue.spokenText).join(""), words(cue.sourceText).join("")].filter(Boolean))];
    const matches = targets.flatMap((target) => {
      const positions: Array<{ start: number; length: number }> = [];
      for (let start = stream.indexOf(target); start >= 0; start = stream.indexOf(target, start + 1)) positions.push({ start, length: target.length });
      return positions;
    }).filter((match, index, all) => all.findIndex((candidate) => candidate.start === match.start && candidate.length === match.length) === index).sort((left, right) => left.start - right.start);
    const match = matches[cue.spokenOccurrence ?? 0];
    if (!match) throw new Error(`Unable to align highlight cue ${cue.id}: ${cue.spokenText}`);
    return { ...cue, startMs: timeAt(match.start, "start"), endMs: timeAt(match.start + match.length, "end") };
  });
}
