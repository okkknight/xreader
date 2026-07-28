import type { PublicParagraphGuide } from "@/types/public-article";

export function CurrentLessonPanel({ guides, activeSentenceId }: { guides: PublicParagraphGuide[]; activeSentenceId?: string }) {
  const guide = guides.find((candidate) => candidate.sentenceGuides.some((sentence) => sentence.sentenceId === activeSentenceId));
  const sentence = guide?.sentenceGuides.find((candidate) => candidate.sentenceId === activeSentenceId);
  return <aside className="current-lesson-panel" aria-label="当前讲解">
    <div className="current-lesson-meta"><span>连续带读</span>{sentence ? <span>{sentence.depth}</span> : null}</div>
    {sentence ? <><p>{sentence.meaningZh}</p>{sentence.focusScript ? <small>{sentence.focusScript}</small> : null}</> : <p className="current-lesson-placeholder">选择一句开始听读。</p>}
  </aside>;
}
