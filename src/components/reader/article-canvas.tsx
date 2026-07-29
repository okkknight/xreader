"use client";

import type { PublicParagraph } from "@/types/public-article";
import type { CourseHighlightCue } from "@/lib/course-blocks/types";
import { sourceHighlightParts } from "@/lib/reader/source-references";
import { AnnotationPopover } from "./annotation-popover";

type ActiveHighlight = Pick<CourseHighlightCue, "sourceStart" | "sourceEnd"> & { sentenceId: string; tone?: number };
type Props = { paragraphs: PublicParagraph[]; activeSentenceId?: string; activeHighlights?: ActiveHighlight[]; seenHighlights?: ActiveHighlight[]; translations: boolean; onSentenceSelect: (id: string) => void };

export function ArticleCanvas({ paragraphs, activeSentenceId, activeHighlights = [], seenHighlights = [], translations, onSentenceSelect }: Props) {
  const selectWithKeyboard = (event: React.KeyboardEvent<HTMLSpanElement>, id: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSentenceSelect(id);
  };
  return <section className="article-canvas" aria-label="文章正文">
    {paragraphs.map((paragraph) => <p key={paragraph.id}>{paragraph.sentences.map((sentence) => <span key={sentence.id} className="sentence-wrap">
      <span role="button" tabIndex={0} className="sentence" data-sentence-id={sentence.id} data-active={activeSentenceId === sentence.id ? "true" : "false"} onClick={() => onSentenceSelect(sentence.id)} onKeyDown={(event) => selectWithKeyboard(event, sentence.id)}>{sourceHighlightParts(sentence.text, [
        ...seenHighlights.filter((highlight) => highlight.sentenceId === sentence.id).map((highlight) => ({ start: highlight.sourceStart, end: highlight.sourceEnd, state: "seen" as const, tone: highlight.tone })),
        ...activeHighlights.filter((highlight) => highlight.sentenceId === sentence.id).map((highlight) => ({ start: highlight.sourceStart, end: highlight.sourceEnd, state: "active" as const, tone: undefined })),
      ]).map((part, index) => part.state ? <span className={`board-reference board-reference-${part.state}${part.tone !== undefined ? ` board-reference-${part.state}-${part.tone}` : ""}`} key={`${part.value}-${part.state}-${part.tone}-${index}`}>{part.value}</span> : <span key={`${part.value}-${index}`}>{part.value}</span>)}</span>{" "}
      {translations && sentence.translationZh ? <span className="translation">{sentence.translationZh}</span> : null}
      {sentence.annotations.map((annotation) => <AnnotationPopover key={annotation.id} annotation={annotation} />)}
    </span>)}</p>)}
  </section>;
}
