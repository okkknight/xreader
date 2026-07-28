import type { SynthesisInput, SynthesisResult, TTSProvider } from "./types";

const retryableStatuses = new Set([429, 500, 502, 503, 504]);

type FishProviderOptions = {
  apiKey: string;
  model: string;
  fetch?: typeof globalThis.fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  maxRetries?: number;
};

export class FishProvider implements TTSProvider {
  private readonly fetcher: typeof globalThis.fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly maxRetries: number;

  constructor(private readonly options: FishProviderOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.maxRetries = options.maxRetries ?? 4;
  }

  async synthesize(input: SynthesisInput): Promise<SynthesisResult> {
    let lastError = "Fish Audio request failed";

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.fetcher("https://api.fish.audio/v1/tts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.options.apiKey}`,
            "Content-Type": "application/json",
            model: this.options.model,
            "Idempotency-Key": input.idempotencyKey,
          },
          body: JSON.stringify({
            text: input.text,
            reference_id: input.referenceId,
            format: "wav",
            ...(input.prosody ? { prosody: input.prosody } : {}),
          }),
        });

        if (response.ok) {
          const bytes = new Uint8Array(await response.arrayBuffer());
          if (bytes.byteLength === 0) throw new Error("Fish Audio returned an empty response");
          return { bytes, providerRequestId: response.headers.get("x-request-id") ?? undefined };
        }

        lastError = `${response.status} ${await response.text()}`.slice(0, 500);
        if (!retryableStatuses.has(response.status)) break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }

      if (attempt < this.maxRetries) await this.sleep(Math.min(30_000, 1_000 * 2 ** attempt));
    }

    throw new Error(`Fish Audio request failed: ${lastError}`);
  }
}
