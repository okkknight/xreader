import type { PublicCourseBlock } from "@/types/public-article";
import { referencedOriginalParts } from "@/lib/reader/source-references";

function firstParagraph(text: string) { return text.split(/\n\s*\n/)[0]?.trim(); }

export function ReferencedOriginalText({ text, original, references }: { text: string; original?: string; references?: string[] }) {
  return referencedOriginalParts(text, original, references).map((part, index) => part.isReference
    ? <mark className="source-reference" key={`${part.value}-${index}`}>{part.value}</mark>
    : <span key={`${part.value}-${index}`}>{part.value}</span>);
}

export function currentLessonText(block?: PublicCourseBlock) {
  const teaching = block?.segments.find((segment) => segment.language === "zh")?.text.trim();
  if (teaching) return teaching;

  const inlineScript = block?.segments.find((segment) => segment.role === "original" || segment.role === "reread")?.text.trim();
  if (!inlineScript) return undefined;
  const [, ...teachingParagraphs] = inlineScript.split(/\n\s*\n/);
  return teachingParagraphs.join("\n\n").trim() || inlineScript;
}

export function currentOriginalText(block?: PublicCourseBlock) {
  const sourceSegment = block?.segments.find((segment) => segment.role === "original" || segment.role === "reread");
  return sourceSegment ? firstParagraph(sourceSegment.text) : undefined;
}

export function currentSourceReferences(block?: PublicCourseBlock) {
  const references = block?.segments.flatMap((segment) => segment.sourceReferences ?? []) ?? [];
  return references.length ? [...new Set(references)] : undefined;
}

export function CurrentLessonPanel({ blocks, activeBlockId, activeSentenceId }: { blocks: PublicCourseBlock[]; activeBlockId?: string; activeSentenceId?: string }) {
  const block = blocks.find((candidate) => candidate.id === activeBlockId) ?? (activeSentenceId ? blocks.find((candidate) => candidate.sentenceId === activeSentenceId || candidate.sentenceIds?.includes(activeSentenceId)) : undefined);
  const teaching = currentLessonText(block);
  const original = currentOriginalText(block);
  const references = currentSourceReferences(block);
  return <aside className="current-lesson-panel" aria-label="当前讲解">
    <div className="current-lesson-meta"><span>{block?.type === "sentence" ? "逐句带读" : "教师讲解"}</span>{block ? <span>{block.type}</span> : null}</div>
      {teaching ? <p><ReferencedOriginalText text={teaching} original={teaching === original ? undefined : original} references={references} /></p> : <p className="current-lesson-placeholder">选择一句开始听读。</p>}
  </aside>;
}
