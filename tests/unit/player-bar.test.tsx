import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlayerBar } from "@/components/player/player-bar";

describe("PlayerBar", () => {
  it("places the reading-mode switch inside the playback dock", () => {
    render(<PlayerBar playing={false} rate={1} completed={false} position="2 / 42" mode="GUIDED" onModeChange={() => undefined} onPlayPause={() => undefined} onPrevious={() => undefined} onNext={() => undefined} onRate={() => undefined} />);

    expect(screen.getByRole("button", { name: "讲解" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "阅读" })).toBeInTheDocument();
  });

  it("keeps the mode switch on the left and the playback controls in the center", () => {
    render(<PlayerBar playing={false} rate={1} completed={false} position="2 / 42" mode="GUIDED" onModeChange={() => undefined} onPlayPause={() => undefined} onPrevious={() => undefined} onNext={() => undefined} onRate={() => undefined} />);

    expect(screen.getByLabelText("阅读模式")).toHaveClass("reader-player-mode-switch");
    expect(screen.getByLabelText("片段控制")).toHaveClass("reader-player-center");
  });

  it("exposes the current clip as a compact progress indicator", () => {
    render(<PlayerBar playing={false} rate={1} completed={false} position="2 / 42" mode="GUIDED" onModeChange={() => undefined} onPlayPause={() => undefined} onPrevious={() => undefined} onNext={() => undefined} onRate={() => undefined} />);

    expect(screen.getByRole("progressbar", { name: "播放进度" })).toHaveAttribute("aria-valuenow", "5");
    expect(screen.getByRole("progressbar", { name: "播放进度" })).toHaveAttribute("aria-valuetext", "2 / 42");
  });

  it("moves the return-to-playback action into the dock when following is paused", () => {
    render(<PlayerBar playing={false} rate={1} completed={false} position="2 / 42" mode="GUIDED" autoFollow={false} onRestoreFollow={() => undefined} onModeChange={() => undefined} onPlayPause={() => undefined} onPrevious={() => undefined} onNext={() => undefined} onRate={() => undefined} />);

    expect(screen.getByRole("button", { name: "回到当前播放" })).toBeInTheDocument();
  });

  it("disables unavailable boundary controls", () => {
    render(<PlayerBar playing={false} rate={1} completed={false} position="1 / 42" mode="GUIDED" canPrevious={false} canNext={true} onModeChange={() => undefined} onPlayPause={() => undefined} onPrevious={() => undefined} onNext={() => undefined} onRate={() => undefined} />);

    expect(screen.getByRole("button", { name: "上一段" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下一段" })).toBeEnabled();
  });

  it("offers a clear replay action after the article completes", () => {
    render(<PlayerBar playing={false} rate={1} completed position="42 / 42" mode="GUIDED" onModeChange={() => undefined} onPlayPause={() => undefined} onPrevious={() => undefined} onNext={() => undefined} onRate={() => undefined} />);

    expect(screen.getByRole("button", { name: "重新开始" })).toBeInTheDocument();
  });
});
