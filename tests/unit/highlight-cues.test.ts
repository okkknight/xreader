import { describe, expect, it } from "vitest";

import { activeHighlightCuesAtTime, activeSentenceIdAtTime, ensureBlockHighlightCues, resolveHighlightCueTimings } from "@/lib/audio/highlight-cues";
import type { CourseBlock } from "@/lib/course-blocks/types";

describe("highlight cue timing", () => {
  it("keeps a teaching underline until the next teaching focus begins, without extending a full-sentence read", () => {
    const cues = [
      { id: "block-1-original-read", sourceText: "Rain falls.", sourceStart: 0, sourceEnd: 11, spokenText: "Rain falls.", startMs: 0, endMs: 1000 },
      { id: "block-1-teaching-1", sourceText: "falls", sourceStart: 5, sourceEnd: 10, spokenText: "falls", startMs: 1200, endMs: 1800 },
      { id: "block-1-teaching-2", sourceText: "Rain", sourceStart: 0, sourceEnd: 4, spokenText: "Rain", startMs: 4600, endMs: 5100 },
    ];

    expect(activeHighlightCuesAtTime(cues, 500).map((cue) => cue.id)).toEqual(["block-1-original-read"]);
    expect(activeHighlightCuesAtTime(cues, 1500).map((cue) => cue.id)).toEqual(["block-1-teaching-1"]);
    expect(activeHighlightCuesAtTime(cues, 4300).map((cue) => cue.id)).toEqual(["block-1-teaching-1"]);
    expect(activeHighlightCuesAtTime(cues, 4800).map((cue) => cue.id)).toEqual(["block-1-teaching-2"]);
    expect(activeHighlightCuesAtTime(cues, 7200).map((cue) => cue.id)).toEqual(["block-1-teaching-2"]);
  });

  it("marks the full original while the teacher reads it", () => {
    const cues = ensureBlockHighlightCues({ id: "block-1", type: "sentence", sentenceId: "p01-s01", segments: [{ language: "en", role: "original", text: "Rain smells different." }] }, new Map([["p01-s01", "Rain smells different."]]));

    expect(cues).toEqual([{ id: "block-1-original-read", sentenceId: "p01-s01", sourceText: "Rain smells different.", sourceStart: 0, sourceEnd: 22, spokenText: "Rain smells different.", spokenOccurrence: 0 }]);
  });

  it("builds title cues from the course title source", () => {
    const cues = ensureBlockHighlightCues({ id: "block-title", type: "title", segments: [{ language: "zh", role: "transition", text: "Why Does Rain Have a Smell?\n\nhave a smell 这里是在问闻起来有没有气味。" }] }, new Map(), "Why Does Rain Have a Smell?");

    expect(cues).toContainEqual({ id: "block-title-original-read", sourceText: "Why Does Rain Have a Smell?", sourceStart: 0, sourceEnd: 27, spokenText: "Why Does Rain Have a Smell?", spokenOccurrence: 0 });
    expect(cues).toContainEqual({ id: "block-title-teaching-1", sourceText: "Have a Smell", sourceStart: 14, sourceEnd: 26, spokenText: "have a smell", spokenOccurrence: 1 });
  });

  it("adds a teaching cue for a legacy explanation that explicitly names original wording", () => {
    const cues = ensureBlockHighlightCues({ id: "block-1", type: "sentence", sentenceId: "p01-s01", segments: [{ language: "en", role: "original", text: "Rain smells different.\n\n先抓住 smells。" }] }, new Map([["p01-s01", "Rain smells different."]]));

    expect(cues).toEqual([
      { id: "block-1-original-read", sentenceId: "p01-s01", sourceText: "Rain smells different.", sourceStart: 0, sourceEnd: 22, spokenText: "Rain smells different.", spokenOccurrence: 0 },
      { id: "block-1-teaching-1", sentenceId: "p01-s01", sourceText: "smells", sourceStart: 5, sourceEnd: 11, spokenText: "smells", spokenOccurrence: 1 },
    ]);
  });

  it("anchors an inflected teaching phrase to the original source wording", () => {
    const cues = ensureBlockHighlightCues({ id: "block-1", type: "sentence", sentenceId: "p01-s01", segments: [{ language: "en", role: "original", text: "That spray gives the scent a route into the air around you.\n\ngive the scent a route into 是这里的核心动作。" }] }, new Map([["p01-s01", "That spray gives the scent a route into the air around you."]]));

    expect(cues).toContainEqual({ id: "block-1-teaching-1", sentenceId: "p01-s01", sourceText: "gives the scent a route into", sourceStart: 11, sourceEnd: 39, spokenText: "give the scent a route into", spokenOccurrence: 1 });
  });

  it("keeps authored cues while adding missing compatible teaching cues", () => {
    const cues = ensureBlockHighlightCues({ id: "block-1", type: "sentence", sentenceId: "p01-s01", highlightCues: [{ id: "block-1-teaching-1", sourceText: "That spray", sourceStart: 0, sourceEnd: 10, spokenText: "That spray", spokenOccurrence: 1 }], segments: [{ language: "en", role: "original", text: "That spray gives the scent a route into the air around you.\n\nThat spray 之后，give the scent a route into 是这里的核心动作。" }] }, new Map([["p01-s01", "That spray gives the scent a route into the air around you."]]));

    expect(cues).toContainEqual({ id: "block-1-teaching-2", sentenceId: "p01-s01", sourceText: "gives the scent a route into", sourceStart: 11, sourceEnd: 39, spokenText: "give the scent a route into", spokenOccurrence: 1 });
  });

  it("maps the intended spoken occurrence to its source phrase timing", () => {
    const timings = resolveHighlightCueTimings(
      [{ text: "It", startMs: 0, endMs: 180 }, { text: "appears", startMs: 180, endMs: 520 }, { text: "dry", startMs: 520, endMs: 760 }, { text: "soil", startMs: 760, endMs: 1040 }, { text: "release", startMs: 1040, endMs: 1360 }, { text: "release", startMs: 2600, endMs: 2920 }],
      [
        { id: "cue-dry-soil", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil" },
        { id: "cue-release", sourceText: "release", sourceStart: 52, sourceEnd: 59, spokenText: "release", spokenOccurrence: 0 },
      ],
    );

    expect(timings).toEqual([
      { id: "cue-dry-soil", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil", startMs: 520, endMs: 1040 },
      { id: "cue-release", sourceText: "release", sourceStart: 52, sourceEnd: 59, spokenText: "release", spokenOccurrence: 0, startMs: 1040, endMs: 1360 },
    ]);
  });

  it("aligns a teaching infinitive after its inflected source occurrence", () => {
    const timings = resolveHighlightCueTimings(
      [{ text: "gives the scent a route into", startMs: 0, endMs: 900 }, { text: "give the scent a route into", startMs: 1800, endMs: 2700 }],
      [{ id: "cue-give", sourceText: "gives the scent a route into", sourceStart: 11, sourceEnd: 39, spokenText: "give the scent a route into", spokenOccurrence: 1 }],
    );

    expect(timings[0]).toMatchObject({ id: "cue-give", startMs: 1800, endMs: 2700 });
  });

  it("matches a cue when Fish merges an English phrase into one aligned segment", () => {
    const timings = resolveHighlightCueTimings(
      [{ text: "drysoil", startMs: 520, endMs: 1040 }],
      [{ id: "cue-dry-soil", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil" }],
    );

    expect(timings[0]).toMatchObject({ id: "cue-dry-soil", startMs: 520, endMs: 1040 });
  });

  it("splits a merged Fish segment proportionally for separate source cues", () => {
    const timings = resolveHighlightCueTimings(
      [{ text: "dry", startMs: 520, endMs: 760 }, { text: "soilplantstiny", startMs: 760, endMs: 1060 }, { text: "organisms", startMs: 1060, endMs: 1300 }],
      [{ id: "cue-dry-soil", sourceText: "dry soil", sourceStart: 16, sourceEnd: 24, spokenText: "dry soil" }],
    );

    expect(timings[0]).toMatchObject({ id: "cue-dry-soil", startMs: 520, endMs: 846 });
  });
});

describe("course highlight sentence ownership", () => {
  it("switches the active sentence inside a multi-sentence block by cue timing", () => {
    const cues = [
      { id: "block-original-read-1", sentenceId: "s1", sourceText: "First sentence.", sourceStart: 0, sourceEnd: 15, spokenText: "First sentence.", startMs: 0, endMs: 1200 },
      { id: "block-original-read-2", sentenceId: "s2", sourceText: "Second sentence.", sourceStart: 0, sourceEnd: 16, spokenText: "Second sentence.", startMs: 1400, endMs: 2600 },
      { id: "block-teaching-s1", sentenceId: "s1", sourceText: "First", sourceStart: 0, sourceEnd: 5, spokenText: "First", startMs: 3200, endMs: 3800 },
    ];

    expect(activeSentenceIdAtTime(cues, 500)).toBe("s1");
    expect(activeSentenceIdAtTime(cues, 1800)).toBe("s2");
    expect(activeSentenceIdAtTime(cues, 3500)).toBe("s1");
    expect(activeHighlightCuesAtTime(cues, 1800).map((cue) => cue.id)).toEqual(["block-original-read-2"]);
  });

  it("assigns generated original and teaching cues to their source sentences", () => {
    const block: CourseBlock = {
      id: "block-1",
      type: "bridge",
      sentenceIds: ["s1", "s2"],
      segments: [
        { language: "en", role: "original", text: "First sentence. Second sentence.", sourceSentenceIds: ["s1", "s2"] },
        { language: "zh", role: "teaching", text: "First 表示第一。", sourceSentenceIds: ["s1"] },
      ],
    };

    const cues = ensureBlockHighlightCues(block, new Map([
      ["s1", "First sentence."],
      ["s2", "Second sentence."],
    ]));

    expect(cues.find((cue) => cue.id.endsWith("-original-read-1"))?.sentenceId).toBe("s1");
    expect(cues.find((cue) => cue.id.endsWith("-original-read-2"))?.sentenceId).toBe("s2");
    expect(cues.some((cue) => cue.sentenceId === "s1" && cue.spokenText === "First")).toBe(true);
  });
});
