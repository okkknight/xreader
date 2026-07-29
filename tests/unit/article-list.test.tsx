import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArticleList } from "@/components/archive/article-list";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = {
  id: "article-1", slug: "why-rain-has-a-smell", titleEn: "Why Does Rain Have a Smell?", titleZh: "为什么雨会有气味？", dekZh: "从干燥的土地到第一滴雨，空气里发生了什么。", topic: "Nature & Science", difficulty: "B1-B2", paragraphs: [], courseBlocks: [],
};

describe("ArticleList", () => {
  it("renders each course as an illustrated shelf card that links to its article", () => {
    render(<ArticleList articles={[article]} />);

    expect(screen.getByRole("img", { name: "Why Does Rain Have a Smell? 课程封面" })).toHaveAttribute("src", expect.stringContaining("why-rain-has-a-smell-cover"));
    expect(screen.getByRole("link", { name: /Why Does Rain Have a Smell/ })).toHaveAttribute("href", "/articles/why-rain-has-a-smell");
    expect(screen.getByText("为什么雨会有气味？")).toBeInTheDocument();
  });
});
