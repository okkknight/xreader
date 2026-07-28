import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleReader } from "@/components/reader/article-reader";
import type { PublicArticle } from "@/types/public-article";

const article: PublicArticle = {
  id: "article-1", slug: "article-1", titleEn: "Audio test", titleZh: "音频测试", dekZh: null, topic: "Test", difficulty: "B1",
  paragraphs: [{ id: "p1", text: "A sentence.", sentences: [{ id: "s1", text: "A sentence.", translationZh: null, annotations: [] }] }],
  lessonSegments: [{ id: "seg-1", order: 1, type: "OPENING", script: "A sentence.", sentenceIds: ["s1"], audioStatus: "READY", audioPath: "/api/media/asset-1" }],
};

describe("ArticleReader audio playback", () => {
  const stored = new Map<string, string>();
  beforeEach(() => { stored.clear(); vi.stubGlobal("localStorage", { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) }); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("plays the active guided segment through a media element", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<ArticleReader article={article} />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "开始讲解" })); });

    const audio = document.querySelector("audio");
    expect(audio?.src).toBe("http://localhost:3000/api/media/asset-1");
    expect(play).toHaveBeenCalledOnce();
  });

  it("records guest progress and exposes segment navigation", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<ArticleReader article={article} />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "开始讲解" })); });
    expect(JSON.parse(stored.get("xreader:progress:article-1") || "{}")).toMatchObject({ guidedSegmentId: "seg-1" });
    fireEvent.click(screen.getByRole("button", { name: "下一段" }));
    expect(screen.getByText("完成", { exact: true })).toBeVisible();
    expect(JSON.parse(stored.get("xreader:progress:article-1") || "{}")).toMatchObject({ completed: true });
  });

  it("follows the active sentence until the listener scrolls away", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    render(<ArticleReader article={article} />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "开始讲解" })); });
    expect(scrollIntoView).toHaveBeenCalled();
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 410)); });
    await act(async () => { window.dispatchEvent(new Event("scroll")); });
    expect(screen.getByRole("button", { name: "回到当前讲解" })).toBeVisible();
  });

  it("restores a completed guest lesson on mount", async () => {
    stored.set("xreader:progress:article-1", JSON.stringify({ guidedSegmentId: "seg-1", completed: true, updatedAt: Date.now() }));
    render(<ArticleReader article={article} />);
    await act(async () => undefined);
    expect(screen.getByText("完成", { exact: true })).toBeVisible();
  });
});
