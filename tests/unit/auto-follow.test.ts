import { describe, expect, it } from "vitest";

import { isOutsideSafeViewportBand } from "@/features/reader/auto-follow";

describe("auto follow", () => {
  it("uses the central 30-40 percent safe viewport band", () => {
    expect(isOutsideSafeViewportBand({ top: 350, bottom: 400 }, 1000)).toBe(false);
    expect(isOutsideSafeViewportBand({ top: 50, bottom: 100 }, 1000)).toBe(true);
  });
});
