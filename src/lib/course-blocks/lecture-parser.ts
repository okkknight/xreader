import { normalizeLectureText, type SourceArticle } from "./source-parser";

export type LectureAnchor = { sentenceId: string; originalText: string; start: number; end: number; occurrence: number; roleHint: "original" | "reread" };
export type LectureAnchors = { normalizedText: string; anchors: LectureAnchor[] };

function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function anchorFinalLecture(source: SourceArticle, finalLecture: string): LectureAnchors {
  const normalizedText = normalizeLectureText(finalLecture);
  const sentences = source.paragraphs.flatMap((paragraph) => paragraph.sentences);
  const anchors: LectureAnchor[] = [];
  const firstPositions: number[] = [];
  for (const sentence of sentences) {
    const expression = new RegExp(escapeRegExp(sentence.text), "g");
    const matches: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = expression.exec(normalizedText))) matches.push(match.index);
    if (matches.length === 0) throw new Error(`missing source sentence: ${sentence.id}`);
    firstPositions.push(matches[0]);
    matches.forEach((start, index) => anchors.push({ sentenceId: sentence.id, originalText: sentence.text, start, end: start + sentence.text.length, occurrence: index + 1, roleHint: index === 0 ? "original" : "reread" }));
  }
  for (let index = 1; index < firstPositions.length; index += 1) {
    if (firstPositions[index] < firstPositions[index - 1]) throw new Error(`source sentence out of order: ${sentences[index].id}`);
  }
  anchors.sort((a, b) => a.start - b.start || a.end - b.end);
  return { normalizedText, anchors };
}
