import { describe, expect, it } from "vitest";

import { createProgressStore } from "@/features/reader/progress";

describe("ProgressStore", () => {
  it("keeps guided and reading positions separately", () => {
    const values = new Map<string, string>();
    const store = createProgressStore({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) });
    store.save("article", { guidedSegmentId: "seg-1", readingSentenceId: "s2" });
    expect(store.load("article")).toMatchObject({ guidedSegmentId: "seg-1", readingSentenceId: "s2" });
  });
});
