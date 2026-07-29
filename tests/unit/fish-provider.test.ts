import { describe, expect, it, vi } from "vitest";

import { FishProvider } from "@/lib/audio/fish-provider";

describe("FishProvider", () => {
  it("retries a 429 then returns audio bytes", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "slow down" }), { status: 429, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([82, 73, 70, 70]), { status: 200, headers: { "content-type": "audio/wav", "x-request-id": "request-1" } }));
    const provider = new FishProvider({ apiKey: "test", model: "s2.1-pro-free", fetch, sleep: async () => undefined });

    await expect(provider.synthesize({ text: "Hello", referenceId: "voice", idempotencyKey: "key", temperature: 0.58, prosody: { speed: 0.88 } }))
      .resolves.toEqual({ bytes: new Uint8Array([82, 73, 70, 70]), providerRequestId: "request-1" });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetch.mock.calls[1]![1].body as string)).toMatchObject({ temperature: 0.58, prosody: { speed: 0.88 } });
  });

  it("returns a global word timeline from Fish timestamp streaming", async () => {
    const first = Buffer.from([1, 2]).toString("base64");
    const second = Buffer.from([3, 4]).toString("base64");
    const stream = [
      `data: ${JSON.stringify({ audio_base64: first, content: "dry soil", chunk_seq: 0, chunk_audio_offset_sec: 0, alignment: { audio_duration: 0.7, segments: [{ text: "dry", start: 0, end: 0.3 }, { text: "soil", start: 0.3, end: 0.7 }] } })}`,
      "",
      `data: ${JSON.stringify({ audio_base64: second, content: "release", chunk_seq: 1, chunk_audio_offset_sec: 0.7, alignment: { audio_duration: 0.4, segments: [{ text: "release", start: 0, end: 0.4 }] } })}`,
      "",
    ].join("\n");
    const fetch = vi.fn().mockResolvedValue(new Response(stream, { status: 200, headers: { "content-type": "text/event-stream", "x-request-id": "request-2" } }));
    const provider = new FishProvider({ apiKey: "test", model: "s2.1-pro-free", fetch });

    await expect(provider.synthesizeWithTimestamps({ text: "dry soil release", referenceId: "voice", idempotencyKey: "key" })).resolves.toEqual({
      bytes: new Uint8Array([1, 2, 3, 4]),
      providerRequestId: "request-2",
      alignment: [{ text: "dry", startMs: 0, endMs: 300 }, { text: "soil", startMs: 300, endMs: 700 }, { text: "release", startMs: 700, endMs: 1100 }],
    });
    expect(fetch.mock.calls[0]![0]).toBe("https://api.fish.audio/v1/tts/stream/with-timestamp");
  });
});
