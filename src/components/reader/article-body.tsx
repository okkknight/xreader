"use client";

import { useState } from "react";
import type { PublicParagraph } from "@/types/public-article";
import { AnnotationPopover } from "./annotation-popover";

type Props = { paragraphs: PublicParagraph[]; activeSentenceId?: string; onSentenceSelect: (id: string) => void };

export function ArticleBody({ paragraphs, activeSentenceId, onSentenceSelect }: Props) {
  const [translations, setTranslations] = useState(false);
  return <section className="article-body" aria-label="文章正文">
    <div className="article-body-tools"><button type="button" onClick={() => setTranslations((value) => !value)}>显示中文</button></div>
    {paragraphs.map((paragraph) => <p key={paragraph.id}>{paragraph.sentences.map((sentence) => <span key={sentence.id} className="sentence-wrap">
      <button type="button" className="sentence" data-sentence-id={sentence.id} data-active={activeSentenceId === sentence.id ? "true" : "false"} onClick={() => onSentenceSelect(sentence.id)}>{sentence.text}</button>{" "}
      {translations && sentence.translationZh ? <span className="translation">{sentence.translationZh}</span> : null}
      {sentence.annotations.map((annotation) => <AnnotationPopover key={annotation.id} annotation={annotation} />)}
    </span>)}</p>)}
  </section>;
}
