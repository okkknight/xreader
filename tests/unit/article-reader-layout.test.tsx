import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArticleReader } from "@/components/reader/article-reader";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = {
  id: "article-1", slug: "rain", titleEn: "Why Does Rain Have a Smell?", titleZh: "雨为什么会有气味？", dekZh: null, topic: "Science", difficulty: "B1", courseBlocks: [],
  paragraphs: [{ id: "p1", text: "Rain has a smell.", sentences: [{ id: "s1", text: "Rain has a smell.", translationZh: null, annotations: [], audioPath: null, audioStatus: "MISSING" }] }],
};

describe("ArticleReader layout", () => {
  it("keeps the reading page focused on a single centered text column without the lecture side panel", () => {
    render(<ArticleReader article={article} />);

    expect(screen.queryByRole("complementary", { name: "当前讲解" })).not.toBeInTheDocument();
  });
});
