import { describe, expect, it } from "vitest";

import { wordsEquivalent } from "@/lib/reader/word-forms";

describe("English word forms", () => {
  it("matches regular noun and verb inflections", () => {
    expect(wordsEquivalent("droplets", "droplet")).toBe(true);
    expect(wordsEquivalent("studies", "study")).toBe(true);
    expect(wordsEquivalent("carried", "carry")).toBe(true);
    expect(wordsEquivalent("making", "make")).toBe(true);
    expect(wordsEquivalent("runs", "run")).toBe(true);
  });

  it("matches common irregular verb forms", () => {
    expect(wordsEquivalent("gave", "give")).toBe(true);
    expect(wordsEquivalent("went", "go")).toBe(true);
    expect(wordsEquivalent("made", "make")).toBe(true);
    expect(wordsEquivalent("brought", "bring")).toBe(true);
  });

  it("does not treat unrelated words as equivalent", () => {
    expect(wordsEquivalent("air", "are")).toBe(false);
    expect(wordsEquivalent("rain", "train")).toBe(false);
  });
});
