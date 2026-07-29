import { describe, expect, it } from "vitest";

import { createProgressStore } from "@/features/reader/progress";

describe("ProgressStore", () => {
  it("keeps guided and reading positions separately", () => {
    const values = new Map<string, string>();
    const store = createProgressStore({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) });
    store.save("article", { guidedBlockId: "block-1", readingSentenceId: "s2" });
    expect(store.load("article")).toMatchObject({ guidedBlockId: "block-1", readingSentenceId: "s2" });
  });

  it("preserves both positions and restores the most recently used mode", () => {
    const values = new Map<string, string>();
    const store = createProgressStore({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) });

    store.save("article", { guidedBlockId: "block-1", lastMode: "GUIDED" });
    store.save("article", { readingSentenceId: "s2", lastMode: "READING" });

    expect(store.load("article")).toMatchObject({ guidedBlockId: "block-1", readingSentenceId: "s2", lastMode: "READING" });
  });
});
