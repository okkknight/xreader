import type { AlignmentSegment } from "./highlight-cues";
import type { CourseBlock, CourseDocument, CourseSubtitleCue, SegmentLanguage } from "@/lib/course-blocks/types";

const normalizedWords = (text: string) => text.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)?/gu)?.join("") ?? "";

function cueLanguage(text: string): SegmentLanguage {
  const hanCount = (text.match(/\p{Script=Han}/gu) ?? []).length;
  return hanCount > 0 ? "zh" : "en";
}

function splitLongPhrase(phrase: string) {
  const compact = phrase.trim();
  if (!compact) return [];
  const limit = cueLanguage(compact) === "zh" ? 30 : 82;
  if ([...compact].length <= limit) return [compact];
  const clauses = compact.split(/(?<=[，、；：,;:])\s*/u).filter(Boolean);
  const parts: string[] = [];
  let current = "";
  for (const clause of clauses) {
    if (current && [...`${current}${clause}`].length > limit) { parts.push(current); current = clause; }
    else current += clause;
  }
  if (current) parts.push(current);
  return parts.length > 1 ? parts : [compact];
}

export function splitSubtitleText(text: string) {
  return text.trim().split(/\n\s*\n/u).flatMap((paragraph) => paragraph.split(/(?<=[。！？!?])\s*/u)).flatMap(splitLongPhrase).filter(Boolean);
}

function alignedTimeAt(alignment: AlignmentSegment[], position: number, boundary: "start" | "end") {
  const segments = alignment.map((segment) => ({ segment, normalized: normalizedWords(segment.text) })).filter((entry) => entry.normalized.length);
  let cursor = 0;
  for (let index = 0; index < segments.length; index += 1) {
    const entry = segments[index];
    const end = cursor + entry.normalized.length;
    if ((boundary === "start" ? position < end : position <= end) || index === segments.length - 1) return Math.round(entry.segment.startMs + ((position - cursor) / entry.normalized.length) * (entry.segment.endMs - entry.segment.startMs));
    cursor = end;
  }
  return 0;
}

export function buildSubtitleCues(block: CourseBlock, alignment: AlignmentSegment[]): CourseSubtitleCue[] {
  const stream = alignment.map((segment) => normalizedWords(segment.text)).filter(Boolean).join("");
  let cursor = 0;
  return splitSubtitleText(block.segments.map((segment) => segment.text).join("\n\n")).flatMap((text, index) => {
    const target = normalizedWords(text);
    const start = target ? stream.indexOf(target, cursor) : -1;
    if (start < 0) return [];
    cursor = start + target.length;
    return [{ id: `${block.id}-subtitle-${index + 1}`, text, language: cueLanguage(text), startMs: alignedTimeAt(alignment, start, "start"), endMs: alignedTimeAt(alignment, cursor, "end") }];
  });
}

export function activeSubtitleCueAtTime(cues: CourseSubtitleCue[], currentTimeMs: number) {
  return cues.find((cue) => currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs);
}

export function missingSubtitleBlockIds(course: CourseDocument) {
  const readyAudioBlockIds = new Set(course.audio.filter((audio) => audio.status === "ready").flatMap((audio) => audio.blockIds));
  return course.blocks.filter((block) => readyAudioBlockIds.has(block.id) && !block.subtitleCues?.length).map((block) => block.id);
}
