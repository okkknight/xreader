import { describe, expect, it } from "vitest";

import { initialPlaybackState, playbackReducer } from "@/features/reader/playback-reducer";

describe("playbackReducer", () => {
  it("suppresses auto-follow after manual scrolling until explicitly restored", () => {
    const away = playbackReducer(initialPlaybackState, { type: "USER_SCROLLED_AWAY" });
    expect(away.autoFollow).toBe(false);
    expect(playbackReducer(away, { type: "RESTORE_AUTO_FOLLOW" }).autoFollow).toBe(true);
  });
});
