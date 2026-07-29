import { describe, expect, it } from "vitest";

import { readerShortcutForKey } from "@/lib/reader/keyboard-shortcuts";

describe("readerShortcutForKey", () => {
  it("maps the playback keys without stealing modified shortcuts or form controls", () => {
    expect(readerShortcutForKey({ key: " ", targetTagName: "DIV" })).toBe("toggle");
    expect(readerShortcutForKey({ key: "ArrowLeft", targetTagName: "DIV" })).toBe("previous");
    expect(readerShortcutForKey({ key: "ArrowRight", targetTagName: "DIV" })).toBe("next");
    expect(readerShortcutForKey({ key: " ", targetTagName: "SELECT" })).toBeUndefined();
    expect(readerShortcutForKey({ key: " ", targetTagName: "DIV", metaKey: true })).toBeUndefined();
  });
});
