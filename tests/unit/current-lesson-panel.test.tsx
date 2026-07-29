import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CurrentLessonPanel } from "@/components/reader/current-lesson-panel";
import { referencedOriginalParts } from "@/lib/reader/source-references";
import type { PublicCourseBlock } from "@/types/public-article";

const blocks: PublicCourseBlock[] = [
  { id: "block-1", type: "sentence", sentenceId: "s1", segments: [{ language: "en", role: "original", text: "First." }, { language: "zh", role: "teaching", text: "第一句台词" }], audioPath: "/api/media/a1", audioStatus: "READY", audioDurationMs: 100 },
  { id: "block-2", type: "sentence", sentenceId: "s1", segments: [{ language: "en", role: "reread", text: "First." }, { language: "zh", role: "teaching", text: "重复朗读台词" }], audioPath: "/api/media/a2", audioStatus: "READY", audioDurationMs: 100 },
];

describe("CurrentLessonPanel", () => {
  it("uses the active block so repeated sentences show the current lecture line", () => {
    render(<CurrentLessonPanel blocks={blocks} activeBlockId="block-2" activeSentenceId="s1" />);
    expect(screen.getByText("重复朗读台词")).toBeVisible();
    expect(screen.queryByText("第一句台词")).toBeNull();
  });

  it("keeps the panel in sync with legacy inline original-plus-teaching blocks", () => {
    const inlineBlock: PublicCourseBlock = { id: "block-3", type: "sentence", sentenceId: "s2", segments: [{ language: "en", role: "original", text: "Rain smells different.\n\n这里是当前讲解。" }], audioPath: "/api/media/a3", audioStatus: "READY", audioDurationMs: 100 };
    render(<CurrentLessonPanel blocks={[inlineBlock]} activeBlockId="block-3" />);
    expect(screen.getByText("这里是当前讲解。")).toBeVisible();
    expect(screen.queryByText("Rain smells different.")).toBeNull();
  });

  it("shows the current original sentence when a reread block has no explanation", () => {
    const rereadBlock: PublicCourseBlock = { id: "block-4", type: "sentence", sentenceId: "s3", segments: [{ language: "en", role: "reread", text: "Listen once more." }], audioPath: "/api/media/a4", audioStatus: "READY", audioDurationMs: 100 };
    render(<CurrentLessonPanel blocks={[rereadBlock]} activeBlockId="block-4" />);
    expect(screen.getByText("Listen once more.")).toBeVisible();
  });

  it("marks only English phrases that are present in the current original sentence", () => {
    expect(referencedOriginalParts("先抓 before 的时间差；notice 是察觉到；reach the ground 指到达地面；unrelated 不突出。", "People often notice the smell of rain before the first drop reaches the ground.")).toEqual([
      { value: "先抓 ", isReference: false },
      { value: "before", isReference: true },
      { value: " 的时间差；", isReference: false },
      { value: "notice", isReference: true },
      { value: " 是察觉到；", isReference: false },
      { value: "reach the ground", isReference: true },
      { value: " 指到达地面；unrelated 不突出。", isReference: false },
    ]);
  });
});
