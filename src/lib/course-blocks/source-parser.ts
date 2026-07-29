export type SourceSentence = { id: string; order: number; text: string };
export type SourceParagraph = { id: string; order: number; text: string; sentences: SourceSentence[] };
export type SourceArticle = { title: string; paragraphs: SourceParagraph[] };

export function normalizeLectureText(input: string) {
  return input
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function splitSentences(text: string) {
  return text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
}

export function parseSourceArticle(markdown: string): SourceArticle {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const titleLine = lines.find((line) => /^\s*#\s+/.test(line));
  if (!titleLine) throw new Error("source article is missing a Markdown title");
  const title = titleLine.replace(/^\s*#\s+/, "").trim();
  const body = lines.filter((line) => line !== titleLine).join("\n").trim();
  const paragraphs = body.split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, " ").trim()).filter(Boolean).map((text, paragraphIndex) => {
    const order = paragraphIndex + 1;
    return { id: `p${String(order).padStart(2, "0")}`, order, text, sentences: splitSentences(text).map((sentence, sentenceIndex) => ({ id: `p${String(order).padStart(2, "0")}-s${String(sentenceIndex + 1).padStart(2, "0")}`, order: sentenceIndex + 1, text: sentence })) };
  });
  return { title, paragraphs };
}
