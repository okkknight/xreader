import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReaderHeader } from "@/components/reader/reader-header";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = { id: "article-1", slug: "rain", titleEn: "Why Does Rain Have a Smell?", titleZh: "雨为什么会有气味？", dekZh: null, topic: "Science", difficulty: "B1", paragraphs: [], courseBlocks: [] };

describe("ReaderHeader", () => {
  it("keeps the reading page free of category and difficulty metadata", () => {
    const { container } = render(<ReaderHeader article={article} />);

    expect(container.querySelector(".reader-kicker")).not.toBeInTheDocument();
  });

  it("renders title highlights with the same active and seen styles as the article body", () => {
    render(<ReaderHeader article={article} activeHighlights={[{ sourceStart: 9, sourceEnd: 13, tone: 0 }]} seenHighlights={[{ sourceStart: 21, sourceEnd: 26 }]} />);

    expect(screen.getByText("Rain")).toHaveClass("board-reference-active");
    expect(screen.getByText("Rain")).not.toHaveClass("board-reference-active-0");
    expect(screen.getByText("Smell")).toHaveClass("board-reference-seen");
    expect(screen.getByText("Smell")).not.toHaveClass("board-reference-seen-0");
  });

  it("starts the title lesson when the English title is selected", () => {
    const onTitleSelect = vi.fn();
    render(<ReaderHeader article={article} onTitleSelect={onTitleSelect} />);

    fireEvent.click(screen.getByRole("button", { name: "Why Does Rain Have a Smell?" }));

    expect(onTitleSelect).toHaveBeenCalledOnce();
  });
});
