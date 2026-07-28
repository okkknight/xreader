"use client";

import type { CourseImport } from "@/types/article";

export function SentenceEditor({ draft, onChange }: { draft: CourseImport; onChange: (draft: CourseImport) => void }) {
  return <div className="admin-panel"><h2>句子</h2>{draft.paragraphs.map((paragraph, paragraphIndex) => <section key={paragraph.id}><h3>第 {paragraph.order} 段</h3>{paragraph.sentences.map((sentence, sentenceIndex) => <label key={sentence.id}><small>{sentence.id}</small><textarea value={sentence.text} onChange={(event) => { const paragraphs = structuredClone(draft.paragraphs); paragraphs[paragraphIndex].sentences[sentenceIndex].text = event.target.value; paragraphs[paragraphIndex].text = paragraphs[paragraphIndex].sentences.map((item) => item.text).join(" "); onChange({ ...draft, paragraphs }); }} /></label>)}</section>)}</div>;
}
