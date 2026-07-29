import { describe, expect, it } from "vitest";

import { renderTeacherBlockText } from "@/lib/audio/teacher-rendering";

describe("renderTeacherBlockText", () => {
  it("keeps the original sentence and explanation contiguous for Fish to render naturally", () => {
    const rendered = renderTeacherBlockText({ id: "b1", type: "sentence", sentenceId: "s1", segments: [{ language: "en", role: "original", text: "Rain smells different. 中文讲解。" }] }, new Map([["s1", "Rain smells different."]]));

    expect(rendered).toContain("Rain smells different. 中文讲解。");
    expect(rendered).not.toContain("(break)");
  });

  it("does not add a pause to a pure reread block", () => {
    expect(renderTeacherBlockText({ id: "b2", type: "sentence", sentenceId: "s1", segments: [{ language: "en", role: "reread", text: "Rain smells different." }] }, new Map([["s1", "Rain smells different."]]))).not.toContain("(break)");
  });
});
