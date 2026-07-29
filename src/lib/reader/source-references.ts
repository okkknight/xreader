export type TextPart = { value: string; isReference: boolean };
export type HighlightState = "active" | "seen";
export type HighlightRange = { start: number; end: number; state: HighlightState; tone?: number };
export type HighlightPart = { value: string; state?: HighlightState; tone?: number };

function hasSourceWord(sourceWords: string[], candidate: string) {
  return sourceWords.some((sourceWord) => wordsEquivalent(sourceWord, candidate) || (candidate.length >= 3 && sourceWord.startsWith(candidate)) || (sourceWord.length >= 3 && candidate.startsWith(sourceWord)));
}

export function referencedOriginalParts(text: string, original?: string, explicitReferences?: string[]): TextPart[] {
  if (explicitReferences?.length) return boardReferenceParts(text, explicitReferences);
  if (!original) return [{ value: text, isReference: false }];
  const sourceWords = original.toLocaleLowerCase().match(/[a-z]+(?:['’-][a-z]+)?/g) ?? [];
  const expression = /[A-Za-z]+(?:['’-][A-Za-z]+)?(?:\s+[A-Za-z]+(?:['’-][A-Za-z]+)?){0,8}/g;
  const parts: TextPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(expression)) {
    const index = match.index ?? 0;
    const value = match[0];
    const candidateWords = value.toLocaleLowerCase().match(/[a-z]+(?:['’-][a-z]+)?/g) ?? [];
    if (!candidateWords.length || !candidateWords.every((word) => hasSourceWord(sourceWords, word))) continue;
    if (index > cursor) parts.push({ value: text.slice(cursor, index), isReference: false });
    parts.push({ value, isReference: true });
    cursor = index + value.length;
  }
  if (cursor < text.length) parts.push({ value: text.slice(cursor), isReference: false });
  return parts.length ? parts : [{ value: text, isReference: false }];
}

export function sourceReferencePhrases(text?: string, original?: string) {
  if (!text || !original || text === original) return [];
  return [...new Set(referencedOriginalParts(text, original).filter((part) => part.isReference).map((part) => part.value))];
}

export function sourceRangeParts(text: string, start: number, end: number): TextPart[] {
  if (start < 0 || end <= start || end > text.length) return [{ value: text, isReference: false }];
  return [
    ...(start ? [{ value: text.slice(0, start), isReference: false }] : []),
    { value: text.slice(start, end), isReference: true },
    ...(end < text.length ? [{ value: text.slice(end), isReference: false }] : []),
  ];
}

export function sourceHighlightParts(text: string, ranges: HighlightRange[]): HighlightPart[] {
  const validRanges = ranges.filter((range) => range.start >= 0 && range.end > range.start && range.end <= text.length);
  if (!validRanges.length) return [{ value: text }];
  const boundaries = [...new Set([0, text.length, ...validRanges.flatMap((range) => [range.start, range.end])])].sort((a, b) => a - b);
  const parts: HighlightPart[] = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    const activeRange = [...validRanges].reverse().find((range) => range.state === "active" && range.start <= start && range.end >= end);
    const seenRange = [...validRanges].reverse().find((range) => range.state === "seen" && range.start <= start && range.end >= end);
    const state = activeRange ? "active" : seenRange ? "seen" : undefined;
    const tone = state === "seen" ? seenRange?.tone : activeRange?.tone;
    const value = text.slice(start, end);
    const previous = parts.at(-1);
    if (previous && previous.state === state && previous.tone === tone) previous.value += value;
    else parts.push({ value, state, tone });
  }
  return parts;
}

const escapePattern = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function boardReferenceParts(text: string, phrases: string[]): TextPart[] {
  const ordered = [...new Set(phrases)].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!ordered.length) return [{ value: text, isReference: false }];
  const expression = new RegExp(`(${ordered.map((phrase) => `\\b${escapePattern(phrase)}\\b`).join("|")})`, "gi");
  return text.split(expression).filter(Boolean).map((value) => ({ value, isReference: ordered.some((phrase) => phrase.toLocaleLowerCase() === value.toLocaleLowerCase()) }));
}
import { wordsEquivalent } from "@/lib/reader/word-forms";
