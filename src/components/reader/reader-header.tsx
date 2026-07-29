import type { PublicArticle } from "@/types/public-article";
import type { CourseHighlightCue } from "@/lib/course-blocks/types";
import { sourceHighlightParts } from "@/lib/reader/source-references";

type TitleHighlight = Pick<CourseHighlightCue, "sourceStart" | "sourceEnd"> & { tone?: number };
type Props = { article: PublicArticle; onTitleSelect?: () => void; activeHighlights?: TitleHighlight[]; seenHighlights?: TitleHighlight[] };

export function ReaderHeader({ article, onTitleSelect, activeHighlights = [], seenHighlights = [] }: Props) {
  const selectWithKeyboard = (event: React.KeyboardEvent<HTMLHeadingElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onTitleSelect?.();
  };
  return <header className="reader-header">
    <h1 role={onTitleSelect ? "button" : undefined} tabIndex={onTitleSelect ? 0 : undefined} onClick={onTitleSelect} onKeyDown={selectWithKeyboard}>{sourceHighlightParts(article.titleEn, [
      ...seenHighlights.map((highlight) => ({ start: highlight.sourceStart, end: highlight.sourceEnd, state: "seen" as const, tone: highlight.tone })),
      ...activeHighlights.map((highlight) => ({ start: highlight.sourceStart, end: highlight.sourceEnd, state: "active" as const, tone: undefined })),
    ]).map((part, index) => part.state ? <span className={`board-reference board-reference-${part.state}${part.tone !== undefined ? ` board-reference-${part.state}-${part.tone}` : ""}`} key={`${part.value}-${part.state}-${part.tone}-${index}`}>{part.value}</span> : <span key={`${part.value}-${index}`}>{part.value}</span>)}</h1>
    <h2>{article.titleZh}</h2>
    {article.dekZh ? <p className="reader-dek">{article.dekZh}</p> : null}
  </header>;
}
