import { describe, expect, it, vi } from "vitest";

import { FishProvider } from "@/lib/audio/fish-provider";

describe("FishProvider", () => {
  it("retries a 429 then returns audio bytes", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "slow down" }), { status: 429, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(new Uint8Array([82, 73, 70, 70]), { status: 200, headers: { "content-type": "audio/wav", "x-request-id": "request-1" } }));
    const provider = new FishProvider({ apiKey: "test", model: "s2.1-pro-free", fetch, sleep: async () => undefined });

    await expect(provider.synthesize({ text: "Hello", referenceId: "voice", idempotencyKey: "key" }))
      .resolves.toEqual({ bytes: new Uint8Array([82, 73, 70, 70]), providerRequestId: "request-1" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
