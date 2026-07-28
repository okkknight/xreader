import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArticleReader } from "@/components/reader/article-reader";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = {
  id: "article-1", slug: "article-1", titleEn: "Audio test", titleZh: "音频测试", dekZh: null, topic: "Test", difficulty: "B1",
  paragraphs: [{ id: "p1", text: "A sentence. Another sentence.", sentences: [{ id: "s1", text: "A sentence.", translationZh: null, annotations: [], audioPath: null, audioStatus: "MISSING" }, { id: "s2", text: "Another sentence.", translationZh: null, annotations: [], audioPath: null, audioStatus: "MISSING" }] }],
  paragraphGuides: [{ id: "guide-1", paragraphId: "p1", order: 1, paragraphGoal: "Read", openingBridge: null, paragraphWrap: null, nextParagraphBridge: null, scriptText: "A sentence. 这是第一句。 Another sentence. 这是第二句。", sentenceGuides: [{ id: "g1", paragraphId: "p1", sentenceId: "s1", order: 1, depth: "QUICK", originalReadText: "A sentence.", meaningZh: "第一句", sentenceFunction: "开始", primaryTeachingGoal: "理解", focusScript: null, bridgeScript: null, estimatedStartMs: 0, estimatedEndMs: 500 }, { id: "g2", paragraphId: "p1", sentenceId: "s2", order: 2, depth: "NORMAL", originalReadText: "Another sentence.", meaningZh: "第二句", sentenceFunction: "推进", primaryTeachingGoal: "理解", focusScript: null, bridgeScript: null, estimatedStartMs: 500, estimatedEndMs: 1000 }], audioPath: "/api/media/asset-1", audioStatus: "READY", audioDurationMs: 1000 }],
};

describe("ArticleReader audio playback", () => {
  const stored = new Map<string, string>();
  beforeEach(() => { stored.clear(); vi.stubGlobal("localStorage", { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) }); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("plays the continuous paragraph guide through a media element", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined); vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<ArticleReader article={article} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "开始讲解" })); });
    expect(document.querySelector("audio")?.src).toBe("http://localhost:3000/api/media/asset-1"); expect(play).toHaveBeenCalledOnce();
  });

  it("records paragraph progress and supports sentence-level highlighting ranges", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined); vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<ArticleReader article={article} />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "开始讲解" })); });
    expect(JSON.parse(stored.get("xreader:progress:article-1") || "{}")).toMatchObject({ guidedParagraphId: "guide-1" });
    const audio = document.querySelector("audio")!; Object.defineProperty(audio, "currentTime", { configurable: true, value: 0.6 }); fireEvent.timeUpdate(audio);
    expect(document.querySelector("[data-sentence-id='s2']")).toHaveAttribute("data-active", "true");
  });

  it("restores a completed guest lesson on mount", async () => {
    stored.set("xreader:progress:article-1", JSON.stringify({ guidedParagraphId: "guide-1", completed: true, updatedAt: Date.now() })); render(<ArticleReader article={article} />); await act(async () => undefined); expect(screen.getByText("完成", { exact: true })).toBeVisible();
  });
});
