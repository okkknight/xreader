import { describe, expect, it } from "vitest";

import { ACTIVE_TEACHER_PERFORMANCE, TEACHER_VOICES } from "@/lib/audio/voice-library";

describe("teacher voice library", () => {
  it("keeps the selected voice active and the bilingual candidate as a manual backup", () => {
    expect(TEACHER_VOICES).toEqual({
      active: { id: "a19fd22b105a423a8c5ae5294b0353df", name: "三三英语老师" },
      backup: { id: "94b5db0e6aab4bec9ce843a3c486bf8e", name: "双语" },
    });
  });

  it("uses the approved 0.9 teacher pace without literal break text", () => {
    expect(ACTIVE_TEACHER_PERFORMANCE.prosody.speed).toBe(0.9);
    expect("pauseAfterOriginal" in ACTIVE_TEACHER_PERFORMANCE).toBe(false);
  });
});
