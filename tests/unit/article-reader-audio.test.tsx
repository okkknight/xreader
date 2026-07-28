import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArticleReader } from "@/components/reader/article-reader";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = {
  id: "article-1", slug: "article-1", titleEn: "Audio test", titleZh: "音频测试", dekZh: null, topic: "Test", difficulty: "B1",
  paragraphs: [{ id: "p1", text: "A sentence.", sentences: [{ id: "s1", text: "A sentence.", translationZh: null, annotations: [] }] }],
  lessonSegments: [{ id: "seg-1", order: 1, type: "OPENING", script: "A sentence.", sentenceIds: ["s1"], audioStatus: "READY", audioPath: "/api/media/asset-1" }],
};

describe("ArticleReader audio playback", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("plays the active guided segment through a media element", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<ArticleReader article={article} />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "开始讲解" })); });

    const audio = document.querySelector("audio");
    expect(audio?.src).toBe("http://localhost:3000/api/media/asset-1");
    expect(play).toHaveBeenCalledOnce();
  });
});
