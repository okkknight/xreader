import type { SynthesisInput, SynthesisResult, TimestampedSynthesisResult, TTSProvider } from "./types";

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
            ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
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

  async synthesizeWithTimestamps(input: SynthesisInput): Promise<TimestampedSynthesisResult> {
    let lastError = "Fish Audio timestamp request failed";
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.fetcher("https://api.fish.audio/v1/tts/stream/with-timestamp", {
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
            ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
          }),
        });
        if (response.ok) {
          const audioChunks: Uint8Array[] = [];
          const snapshots = new Map<number, { offsetMs: number; segments: Array<{ text: string; start: number; end: number }> }>();
          for (const line of (await response.text()).split(/\r?\n/)) {
            if (!line.startsWith("data: ")) continue;
            const event = JSON.parse(line.slice(6)) as { audio_base64?: string; chunk_seq?: number; chunk_audio_offset_sec?: number; alignment?: { segments: Array<{ text: string; start: number; end: number }> } | null };
            if (event.audio_base64) audioChunks.push(Uint8Array.from(Buffer.from(event.audio_base64, "base64")));
            if (event.alignment && event.chunk_seq !== undefined) snapshots.set(event.chunk_seq, { offsetMs: Math.round((event.chunk_audio_offset_sec ?? 0) * 1000), segments: event.alignment.segments });
          }
          const bytes = new Uint8Array(audioChunks.reduce((length, chunk) => length + chunk.length, 0));
          let offset = 0;
          for (const chunk of audioChunks) { bytes.set(chunk, offset); offset += chunk.length; }
          if (!bytes.byteLength) throw new Error("Fish Audio returned an empty timestamp stream");
          const alignment = [...snapshots.entries()].sort(([a], [b]) => a - b).flatMap(([, snapshot]) => snapshot.segments.map((segment) => ({ text: segment.text, startMs: snapshot.offsetMs + Math.round(segment.start * 1000), endMs: snapshot.offsetMs + Math.round(segment.end * 1000) })));
          return { bytes, providerRequestId: response.headers.get("x-request-id") ?? undefined, alignment };
        }
        lastError = `${response.status} ${await response.text()}`.slice(0, 500);
        if (!retryableStatuses.has(response.status)) break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      if (attempt < this.maxRetries) await this.sleep(Math.min(30_000, 1_000 * 2 ** attempt));
    }
    throw new Error(`Fish Audio timestamp request failed: ${lastError}`);
  }
}
