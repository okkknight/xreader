import type { CourseBlock, CourseHighlightCue } from "@/lib/course-blocks/types";
import { sourceReferencePhrases } from "@/lib/reader/source-references";
import { wordsEquivalent } from "@/lib/reader/word-forms";

export type AlignmentSegment = { text: string; startMs: number; endMs: number };
export type TimedHighlightCue = CourseHighlightCue & Required<Pick<CourseHighlightCue, "startMs" | "endMs">>;
export const isOriginalReadCue = (cue: Pick<CourseHighlightCue, "id">) => /-original-read(?:-\d+)?$/.test(cue.id);
const words = (text: string) => text.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)?/gu) ?? [];
const englishWordRanges = (text: string) => [...text.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g)].map((match) => ({ value: match[0], start: match.index ?? 0, end: (match.index ?? 0) + match[0].length }));

export function activeHighlightCuesAtTime(cues: CourseHighlightCue[], currentTimeMs: number) {
  const timedCues = cues.filter((cue): cue is TimedHighlightCue => cue.startMs !== undefined && cue.endMs !== undefined);
  const latestTeachingCue = timedCues
    .filter((cue) => !isOriginalReadCue(cue) && currentTimeMs >= cue.startMs)
    .sort((a, b) => a.startMs - b.startMs)
    .at(-1);

  if (latestTeachingCue) return [latestTeachingCue];

  return timedCues.filter((cue) => isOriginalReadCue(cue) && currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs);
}

export function activeSentenceIdAtTime(cues: CourseHighlightCue[], currentTimeMs: number, fallback?: string) {
  const timedCues = cues.filter((cue): cue is TimedHighlightCue => cue.startMs !== undefined && cue.endMs !== undefined && Boolean(cue.sentenceId));
  const originalRead = timedCues
    .filter((cue) => isOriginalReadCue(cue) && currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs)
    .at(-1);
  if (originalRead?.sentenceId) return originalRead.sentenceId;
  const teaching = timedCues
    .filter((cue) => !isOriginalReadCue(cue) && currentTimeMs >= cue.startMs)
    .sort((a, b) => a.startMs - b.startMs)
    .at(-1);
  return teaching?.sentenceId ?? fallback;
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
  const authoredCues = block.highlightCues?.filter((cue) => !isOriginalReadCue(cue)) ?? [];
  const sourceSentenceIds = [...new Set([...(block.sentenceIds ?? []), ...(block.sentenceId ? [block.sentenceId] : []), ...block.segments.flatMap((segment) => segment.sourceSentenceIds ?? [])])];
  const sourceEntries = sourceSentenceIds.flatMap((sentenceId) => {
    const text = sourceSentenceById.get(sentenceId);
    return text ? [{ sentenceId, text }] : [];
  });
  const titleSource = block.type === "title" ? block.original ?? courseTitle : undefined;
  if (!sourceEntries.length && !titleSource) return authoredCues;
  const ownedAuthoredCues = authoredCues.map((cue) => {
    if (cue.sentenceId || sourceEntries.length < 2) return cue;
    const owners = sourceEntries.filter(({ text }) => text.slice(cue.sourceStart, cue.sourceEnd) === cue.sourceText);
    return owners.length === 1 ? { ...cue, sentenceId: owners[0].sentenceId } : cue;
  });
  const originalReadCues: CourseHighlightCue[] = sourceEntries.length
    ? sourceEntries.map(({ sentenceId, text }, index) => ({ id: sourceEntries.length === 1 ? `${block.id}-original-read` : `${block.id}-original-read-${index + 1}`, sentenceId, sourceText: text, sourceStart: 0, sourceEnd: text.length, spokenText: text, spokenOccurrence: 0 }))
    : [{ id: `${block.id}-original-read`, sourceText: titleSource!, sourceStart: 0, sourceEnd: titleSource!.length, spokenText: titleSource!, spokenOccurrence: 0 }];
  const cueSources: Array<{ sentenceId?: string; text: string }> = sourceEntries.length ? sourceEntries : [{ text: titleSource! }];
  const fullScript = block.segments.map((segment) => segment.text).join(" ");
  const teachingCues = cueSources.flatMap(({ sentenceId, text }) => {
    const teaching = block.segments
      .filter((segment) => cueSources.length === 1 || segment.sourceSentenceIds?.includes(sentenceId!))
      .flatMap((segment) => segment.text.split(/\n\s*\n/).filter((part, index) => !(index === 0 && part.trim() === text)).map((part) => part.trim()))
      .filter(Boolean)
      .join("\n\n");
    return sourceReferencePhrases(teaching, text).flatMap((spokenText, index) => {
      const sourceRange = sourcePhraseRange(text, spokenText);
      const spokenIndex = fullScript.toLocaleLowerCase().indexOf(spokenText.toLocaleLowerCase(), text.length);
      if (!sourceRange || spokenIndex < 0) return [];
      const before = fullScript.slice(0, spokenIndex);
      const spokenOccurrence = compatiblePhraseOccurrences(before, spokenText);
      return [{ id: `${block.id}-teaching-${sourceEntries.length > 1 ? `${sentenceId}-` : ""}${index + 1}`, ...(sentenceId ? { sentenceId } : {}), sourceText: text.slice(sourceRange.start, sourceRange.end), sourceStart: sourceRange.start, sourceEnd: sourceRange.end, spokenText, spokenOccurrence }];
    });
  });
  const missingTeachingCues = teachingCues.filter((generatedCue) => !ownedAuthoredCues.some((authoredCue) => authoredCue.sourceStart === generatedCue.sourceStart && authoredCue.sourceEnd === generatedCue.sourceEnd && (!generatedCue.sentenceId || !authoredCue.sentenceId || authoredCue.sentenceId === generatedCue.sentenceId)));
  return [...originalReadCues, ...ownedAuthoredCues, ...missingTeachingCues];
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
