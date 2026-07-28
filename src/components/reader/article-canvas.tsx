"use client";

import type { PublicParagraph } from "@/types/public-article";
import { AnnotationPopover } from "./annotation-popover";

type Props = { paragraphs: PublicParagraph[]; activeSentenceId?: string; translations: boolean; onSentenceSelect: (id: string) => void };

export function ArticleCanvas({ paragraphs, activeSentenceId, translations, onSentenceSelect }: Props) {
  return <section className="article-canvas" aria-label="文章正文">
    {paragraphs.map((paragraph) => <p key={paragraph.id}>{paragraph.sentences.map((sentence) => <span key={sentence.id} className="sentence-wrap">
      <button type="button" className="sentence" data-sentence-id={sentence.id} data-active={activeSentenceId === sentence.id ? "true" : "false"} onClick={() => onSentenceSelect(sentence.id)}>{sentence.text}</button>{" "}
      {translations && sentence.translationZh ? <span className="translation">{sentence.translationZh}</span> : null}
      {sentence.annotations.map((annotation) => <AnnotationPopover key={annotation.id} annotation={annotation} />)}
    </span>)}</p>)}
  </section>;
}
