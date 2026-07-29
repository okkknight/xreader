import { describe, expect, it } from "vitest";
import { parseSourceArticle } from "@/lib/course-blocks/source-parser";
import { anchorFinalLecture } from "@/lib/course-blocks/lecture-parser";

const source = `# Why Rain Smells\n\nPeople notice rain before it falls. The air changes first.\n\nRain carries compounds upward.`;

describe("course block source and lecture parser", () => {
  it("creates stable paragraph and sentence IDs from Markdown source", () => {
    expect(parseSourceArticle(source)).toEqual({
      title: "Why Rain Smells",
      paragraphs: [
        { id: "p01", order: 1, text: "People notice rain before it falls. The air changes first.", sentences: [{ id: "p01-s01", order: 1, text: "People notice rain before it falls." }, { id: "p01-s02", order: 2, text: "The air changes first." }] },
        { id: "p02", order: 2, text: "Rain carries compounds upward.", sentences: [{ id: "p02-s01", order: 1, text: "Rain carries compounds upward." }] },
      ],
    });
  });

  it("anchors bolded original sentences and permits purposeful rereads", () => {
    const article = parseSourceArticle(source);
    const lecture = `**Why Rain Smells**\n\nPeople notice rain before it falls. 这句先听整体。People notice rain before it falls.\n\nThe air changes first.\n\nRain carries compounds upward.`;
    const result = anchorFinalLecture(article, lecture);
    expect(result.anchors.map((anchor) => anchor.sentenceId)).toEqual(["p01-s01", "p01-s01", "p01-s02", "p02-s01"]);
    expect(result.anchors[0].roleHint).toBe("original");
    expect(result.anchors[1].roleHint).toBe("reread");
  });

  it("rejects missing, altered, and reordered source sentences", () => {
    const article = parseSourceArticle(source);
    expect(() => anchorFinalLecture(article, "People notice rain before it falls.")).toThrow(/missing source sentence/);
    expect(() => anchorFinalLecture(article, "People notice rain before it fell. The air changes first. Rain carries compounds upward.")).toThrow(/missing source sentence/);
    expect(() => anchorFinalLecture(article, "The air changes first. People notice rain before it falls. Rain carries compounds upward.")).toThrow(/out of order/);
  });
});
