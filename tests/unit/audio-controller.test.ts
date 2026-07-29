import { describe, expect, it, vi } from "vitest";

import { AudioController } from "@/features/reader/audio-controller";

describe("AudioController", () => {
  it("ignores stale play completions after a rapid navigation", async () => {
    const resolvers: Array<() => void> = [];
    const audio = { src: "", play: vi.fn(() => new Promise<void>((resolve) => resolvers.push(resolve))), pause: vi.fn(), addEventListener: vi.fn() } as unknown as HTMLAudioElement;
    const advanced: string[] = [];
    const controller = new AudioController(audio, (item) => { if (item) advanced.push(item.id); });
    controller.setQueue([{ id: "one", sentenceIds: ["s1"], audioPath: "/one.wav" }, { id: "two", sentenceIds: ["s2"], audioPath: "/two.wav" }]);

    const first = controller.play("one");
    controller.next();
    resolvers[0]();
    await first;
    expect(advanced).toEqual([]);
    resolvers[1]();
    await Promise.resolve();
    expect(advanced).toEqual(["two"]);
  });

  it("restarts the current item from the beginning when explicitly replayed", async () => {
    const audio = { src: "", currentTime: 8, play: vi.fn(async () => undefined), pause: vi.fn(), addEventListener: vi.fn() } as unknown as HTMLAudioElement;
    const controller = new AudioController(audio);
    controller.setQueue([{ id: "one", sentenceIds: ["s1"], audioPath: "/one.wav" }]);

    await controller.play("one");
    audio.currentTime = 5;
    await controller.play("one", { restart: true });

    expect(audio.currentTime).toBe(0);
  });
});
