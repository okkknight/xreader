import { describe, expect, it } from "vitest";

import { buildSubtitleCues, missingSubtitleBlockIds } from "@/lib/audio/subtitle-cues";

describe("subtitle cues", () => {
  it("splits a bilingual teaching block into short, aligned subtitle cues", () => {
    const cues = buildSubtitleCues({
      id: "block-1",
      type: "sentence",
      sentenceId: "s1",
      segments: [{ language: "en", role: "original", text: "That familiar scent has a name.\n\n它有一个名字，叫 petrichor。" }],
    }, [
      { text: "That", startMs: 0, endMs: 120 },
      { text: "familiar", startMs: 120, endMs: 360 },
      { text: "scent", startMs: 360, endMs: 520 },
      { text: "has", startMs: 520, endMs: 640 },
      { text: "a", startMs: 640, endMs: 720 },
      { text: "name", startMs: 720, endMs: 960 },
      { text: "break", startMs: 960, endMs: 1300 },
      { text: "它", startMs: 1400, endMs: 1500 },
      { text: "有", startMs: 1500, endMs: 1600 },
      { text: "一", startMs: 1600, endMs: 1700 },
      { text: "个", startMs: 1700, endMs: 1800 },
      { text: "名", startMs: 1800, endMs: 1900 },
      { text: "字", startMs: 1900, endMs: 2000 },
      { text: "叫", startMs: 2100, endMs: 2200 },
      { text: "petrichor", startMs: 2200, endMs: 2600 },
    ]);

    expect(cues).toEqual([
      { id: "block-1-subtitle-1", text: "That familiar scent has a name.", language: "en", startMs: 0, endMs: 960 },
      { id: "block-1-subtitle-2", text: "它有一个名字，叫 petrichor。", language: "zh", startMs: 1400, endMs: 2600 },
    ]);
  });

  it("flags every ready audio block that is missing subtitle cues", () => {
    expect(missingSubtitleBlockIds({
      schemaVersion: 1,
      slug: "subtitle-check",
      title: "Subtitle check",
      sourceHash: "source",
      finalLectureHash: "lecture",
      blocks: [
        { id: "with-subtitles", type: "intro", segments: [{ language: "zh", role: "teaching", text: "有字幕。" }], subtitleCues: [{ id: "cue", text: "有字幕。", language: "zh", startMs: 0, endMs: 500 }] },
        { id: "missing-subtitles", type: "bridge", segments: [{ language: "zh", role: "transition", text: "缺少字幕。" }] },
      ],
      audio: [
        { audioId: "audio-1", blockIds: ["with-subtitles"], path: "/audio-1", durationMs: 500, status: "ready", scriptHash: "one" },
        { audioId: "audio-2", blockIds: ["missing-subtitles"], path: "/audio-2", durationMs: 500, status: "ready", scriptHash: "two" },
      ],
    })).toEqual(["missing-subtitles"]);
  });
});
