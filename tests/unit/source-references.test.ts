import { describe, expect, it } from "vitest";

import { boardReferenceParts, referencedOriginalParts, sourceHighlightParts, sourceRangeParts, sourceReferencePhrases } from "@/lib/reader/source-references";

describe("source references", () => {
  it("keeps prior phrase highlights while letting the active phrase take priority", () => {
    expect(sourceHighlightParts("People notice rain.", [
      { start: 7, end: 13, state: "seen" },
      { start: 14, end: 18, state: "active" },
    ])).toEqual([
      { value: "People " },
      { value: "notice", state: "seen" },
      { value: " " },
      { value: "rain", state: "active" },
      { value: "." },
    ]);
  });

  it("retains a distinct tone for each completed phrase", () => {
    expect(sourceHighlightParts("Rain smells different.", [
      { start: 0, end: 4, state: "seen", tone: 0 },
      { start: 5, end: 11, state: "seen", tone: 1 },
    ])).toEqual([
      { value: "Rain", state: "seen", tone: 0 },
      { value: " " },
      { value: "smells", state: "seen", tone: 1 },
      { value: " different." },
    ]);
  });

  it("keeps a teaching phrase's tone while it is actively underlined", () => {
    expect(sourceHighlightParts("Rain smells different.", [
      { start: 5, end: 11, state: "active", tone: 3 },
    ])).toEqual([
      { value: "Rain " },
      { value: "smells", state: "active", tone: 3 },
      { value: " different." },
    ]);
  });

  it("lets a later overlapping phrase keep its own completed tone", () => {
    expect(sourceHighlightParts("one single perfume", [
      { start: 0, end: 18, state: "seen", tone: 3 },
      { start: 0, end: 10, state: "seen", tone: 0 },
    ])).toEqual([
      { value: "one single", state: "seen", tone: 0 },
      { value: " perfume", state: "seen", tone: 3 },
    ]);
  });

  it("uses the same referenced phrases for the lecture panel and the original sentence", () => {
    const original = "The word joins Greek roots for stone and a fluid once linked to the earth.";
    const phrases = sourceReferencePhrases("先抓住 The word joins Greek roots；再看 a fluid once linked to the earth。", original);
    expect(phrases).toEqual(["The word joins Greek roots", "a fluid once linked to the earth"]);
    expect(boardReferenceParts(original, phrases).filter((part) => part.isReference).map((part) => part.value)).toEqual(phrases);
  });

  it("does not treat teaching placeholders as original-word references", () => {
    const original = "It appears when dry soil, plants, and tiny organisms release compounds into the air.";
    const phrases = sourceReferencePhrases("release A into B 是很实用的表达，表示把 A 释放进 B。", original);

    expect(phrases).not.toContain("A");
    expect(boardReferenceParts(original, ["A"]).some((part) => part.isReference)).toBe(false);
  });

  it("uses explicit course references instead of guessing from a teaching example", () => {
    const teaching = "It 指雨味。release A into B 是很实用的表达，表示把 A 释放进 B。";
    const parts = referencedOriginalParts(teaching, "It appears when dry soil, plants, and tiny organisms release compounds into the air.", ["It", "release"]);

    expect(parts.filter((part) => part.isReference).map((part) => part.value)).toEqual(["It", "release"]);
  });

  it("marks only the authored source range when a word repeats", () => {
    const text = "It appears when dry soil, plants, and tiny organisms release compounds into the air.";
    expect(sourceRangeParts(text, 53, 60)).toEqual([
      { value: "It appears when dry soil, plants, and tiny organisms ", isReference: false },
      { value: "release", isReference: true },
      { value: " compounds into the air.", isReference: false },
    ]);
  });
});
