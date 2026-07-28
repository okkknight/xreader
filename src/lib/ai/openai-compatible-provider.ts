import type { LLMProvider, StructuredGenerationRequest } from "./provider";

type OpenAICompatibleProviderOptions = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export class OpenAICompatibleProvider implements LLMProvider {
  private readonly fetcher: typeof globalThis.fetch;

  constructor(private readonly options: OpenAICompatibleProviderOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch;
  }

  async generateStructured<T>(request: StructuredGenerationRequest): Promise<T> {
    const response = await this.fetcher(`${this.options.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.options.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model ?? this.options.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: request.prompt },
          { role: "user", content: JSON.stringify(request.input) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`LLM request failed: ${response.status} ${await response.text()}`.slice(0, 500));
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM response did not contain structured content");
    return JSON.parse(content) as T;
  }
}
