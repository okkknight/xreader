import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GuidedSubtitle } from "@/components/player/guided-subtitle";

describe("GuidedSubtitle", () => {
  it("shows only the currently spoken short cue above the player", () => {
    render(<GuidedSubtitle cue={{ id: "subtitle-2", text: "它有一个名字，叫 petrichor。", language: "zh", startMs: 1400, endMs: 2600 }} />);

    expect(screen.getByText("它有一个名字，叫 petrichor。")).toBeInTheDocument();
    expect(screen.getByLabelText("教学字幕")).toHaveClass("guided-subtitle");
  });

  it("keeps the current cue visible but visually quiet when playback pauses", () => {
    render(<GuidedSubtitle paused cue={{ id: "subtitle-2", text: "它有一个名字，叫 petrichor。", language: "zh", startMs: 1400, endMs: 2600 }} />);

    expect(screen.getByLabelText("教学字幕")).toHaveAttribute("data-paused", "true");
  });
});
