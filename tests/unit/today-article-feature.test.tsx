import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayArticleFeature } from "@/components/home/today-article-feature";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = {
  id: "article-1", slug: "why-rain-has-a-smell", titleEn: "Why Does Rain Have a Smell?", titleZh: "为什么雨会有气味？", dekZh: "从干燥的土地到第一滴雨，空气里发生了什么。", topic: "Nature & Science", difficulty: "B1-B2", paragraphs: [], courseBlocks: [],
};

describe("TodayArticleFeature", () => {
  it("renders the article as an illustrated reading cover with both entry paths", () => {
    render(<TodayArticleFeature article={article} />);

    expect(screen.getByRole("img", { name: "雨落在干燥土地与植物上的艺术插图" })).toHaveAttribute("src", expect.stringContaining("why-rain-has-a-smell-cover"));
    expect(screen.getByRole("heading", { name: "Why Does Rain Have a Smell?" })).toBeInTheDocument();
    expect(screen.getByText("为什么雨会有气味？")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始讲解" })).toHaveAttribute("href", "/articles/why-rain-has-a-smell");
    expect(screen.getByRole("link", { name: "先读文章" })).toHaveAttribute("href", "/articles/why-rain-has-a-smell?mode=reading");
  });
});
