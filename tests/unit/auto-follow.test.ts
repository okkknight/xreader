import { describe, expect, it } from "vitest";

import { isSentenceComfortablyVisible } from "@/lib/reader/auto-follow";

describe("isSentenceComfortablyVisible", () => {
  it("keeps auto-follow enabled after a small manual scroll while the current sentence remains readable", () => {
    expect(isSentenceComfortablyVisible({ top: 170, bottom: 215 }, 900)).toBe(true);
  });

  it("marks the reader as away only after the current sentence leaves the reading area", () => {
    expect(isSentenceComfortablyVisible({ top: -20, bottom: 25 }, 900)).toBe(false);
  });
});
